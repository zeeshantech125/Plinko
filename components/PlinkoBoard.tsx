import React, { useRef, useEffect } from 'react';
import { GameState, RiskLevel } from '../types';
import { MULTIPLIERS, COLORS } from '../constants';
import { audioService } from '../services/audioService';

interface PlinkoBoardProps {
  rows: number;
  risk: RiskLevel;
  gameState: GameState;
  path: number[] | null;
  onAnimationComplete: () => void;
}

// Physics Constants
const GRAVITY = 0.28;
const RESTITUTION = 0.55; // Bounciness of pegs
const WALL_RESTITUTION = 0.3; // Bounciness of walls/separators (dampening)
const FRICTION = 0.99;
const PEG_RADIUS = 3;
const BALL_RADIUS = 5.5;

export const PlinkoBoard: React.FC<PlinkoBoardProps> = ({
  rows,
  risk,
  gameState,
  path,
  onAnimationComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  
  // Physics State Ref
  const state = useRef({
    ball: { 
      x: 0, 
      y: 0, 
      vx: 0, 
      vy: 0, 
      active: false,
      landing: false, // Phase when ball is inside a bucket
      settled: false,
      scale: 1, // For shrink animation
      history: [] as {x: number, y: number}[],
      currentDecisionIndex: 0
    },
    pegs: [] as {x: number, y: number, r: number, row: number, col: number}[],
    separators: [] as {x: number, y: number, w: number, h: number}[], // Bucket walls
    buckets: [] as {x: number, y: number, w: number, h: number, val: number, index: number}[],
    dimensions: { width: 0, height: 0 },
    lastCollision: 0,
    targetBucketIndex: -1 // Calculated from path
  });

  // Calculate Target Bucket from Path
  useEffect(() => {
    if (path) {
      // Logic: count 'rights' (1s) to find bucket index
      const rights = path.reduce((a, b) => a + b, 0);
      state.current.targetBucketIndex = rights;
    }
  }, [path]);

  // Handle Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        state.current.dimensions = { width: clientWidth, height: clientHeight };
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Compute Geometry (Pegs & Buckets)
  useEffect(() => {
    const { width, height } = state.current.dimensions;
    if (width === 0) return;

    const paddingTop = 40;
    const paddingBottom = 80; // More space for buckets
    const availableHeight = height - paddingTop - paddingBottom;
    
    // Rows = user selected rows (8-12)
    // Pyramid logic: Row R has R+3 pegs.
    // Last Row (index rows-1) has rows+2 pegs.
    // This creates rows+1 gaps (buckets).
    
    const spacingY = availableHeight / rows;
    const spacingX = width / (rows + 4); 
    
    const newPegs = [];
    const newBuckets = [];
    const newSeparators = [];

    // 1. Generate Pegs
    for (let r = 0; r < rows; r++) {
      const pegsInRow = r + 3;
      const rowWidth = (pegsInRow - 1) * spacingX;
      const startX = (width - rowWidth) / 2;
      
      for (let c = 0; c < pegsInRow; c++) {
        newPegs.push({
          x: startX + c * spacingX,
          y: paddingTop + r * spacingY,
          r: PEG_RADIUS,
          row: r,
          col: c
        });
      }
    }

    // 2. Generate Buckets & Separators
    const multipliers = MULTIPLIERS[rows][risk];
    const bucketCount = rows + 1;
    const totalBucketWidth = bucketCount * spacingX;
    const bucketsStartX = (width - totalBucketWidth) / 2;
    const bucketY = paddingTop + (rows) * spacingY + 10; // Slightly below last peg row
    const bucketH = 40;
    const separatorW = 2;

    for (let i = 0; i < bucketCount; i++) {
      const bx = bucketsStartX + i * spacingX;
      
      // Bucket Zone
      newBuckets.push({
        x: bx,
        y: bucketY,
        w: spacingX,
        h: bucketH,
        val: multipliers[i],
        index: i
      });

      // Left Separator for this bucket (acts as right separator for previous)
      newSeparators.push({
        x: bx,
        y: bucketY - 10, // Start slightly higher to catch ball
        w: separatorW,
        h: bucketH + 10
      });
      
      // Add final Right Separator for the last bucket
      if (i === bucketCount - 1) {
        newSeparators.push({
          x: bx + spacingX,
          y: bucketY - 10,
          w: separatorW,
          h: bucketH + 10
        });
      }
    }

    state.current.pegs = newPegs;
    state.current.buckets = newBuckets;
    state.current.separators = newSeparators;
    
  }, [state.current.dimensions.width, rows, risk]);

  // Trigger Drop
  useEffect(() => {
    if (gameState === GameState.DROPPING && path) {
      const { width } = state.current.dimensions;
      state.current.ball = {
        x: width / 2,
        y: 20,
        vx: (Math.random() - 0.5) * 1, // Slight jitter
        vy: 0,
        active: true,
        landing: false,
        settled: false,
        scale: 1,
        history: [],
        currentDecisionIndex: 0
      };
      audioService.playDrop();
    }
  }, [gameState, path]);

  // Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const { width, height } = state.current.dimensions;
      const ball = state.current.ball;

      // 1. Resize
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      // 2. Physics Update
      if (ball.active) {
        if (!ball.settled) {
            // Gravity
            ball.vy += GRAVITY;
            ball.vx *= FRICTION;
            ball.vy *= FRICTION;
            
            ball.x += ball.vx;
            ball.y += ball.vy;

            // -- WALLS --
            // Left Wall
            if (ball.x < BALL_RADIUS) {
                ball.x = BALL_RADIUS;
                ball.vx *= -WALL_RESTITUTION;
            }
            // Right Wall
            if (ball.x > width - BALL_RADIUS) {
                ball.x = width - BALL_RADIUS;
                ball.vx *= -WALL_RESTITUTION;
            }

            // -- PEGS -- (Only if not in landing phase)
            if (!ball.landing) {
                for (const peg of state.current.pegs) {
                    const dx = ball.x - peg.x;
                    const dy = ball.y - peg.y;
                    const distSq = dx*dx + dy*dy;
                    const minDist = PEG_RADIUS + BALL_RADIUS;
                    
                    if (distSq < minDist * minDist) {
                        const dist = Math.sqrt(distSq);
                        const overlap = minDist - dist;
                        const nx = dx / dist;
                        const ny = dy / dist;
                        
                        ball.x += nx * overlap;
                        ball.y += ny * overlap;
                        
                        // Bounce
                        const dot = ball.vx * nx + ball.vy * ny;
                        ball.vx = ball.vx - (1 + RESTITUTION) * dot * nx;
                        ball.vy = ball.vy - (1 + RESTITUTION) * dot * ny;

                        // GUIDANCE
                        // If hitting a peg, slightly nudge towards target path
                        if (path && peg.row >= ball.currentDecisionIndex && peg.row < path.length) {
                             const dir = path[peg.row]; // 1 = Right
                             // If dir is right, we want positive X force
                             const force = 0.5;
                             if (dir === 1) ball.vx += force;
                             else ball.vx -= force;
                        }
                        
                        // Audio
                        if (Date.now() - state.current.lastCollision > 60) {
                            // audioService.playPegHit();
                            state.current.lastCollision = Date.now();
                        }
                    }
                }
            }

            // -- SEPARATORS (Bucket Walls) --
            // Check collisions with vertical dividers
            for (const sep of state.current.separators) {
                // AABB vs Circle rough check
                // Separator is a thin line rect
                // Check X bounds
                if (ball.x + BALL_RADIUS > sep.x && ball.x - BALL_RADIUS < sep.x + sep.w) {
                    // Check Y bounds
                    if (ball.y + BALL_RADIUS > sep.y && ball.y - BALL_RADIUS < sep.y + sep.h) {
                        // Collision!
                        // Determine side
                        const isLeft = ball.x < sep.x + sep.w / 2;
                        
                        if (isLeft) {
                             ball.x = sep.x - BALL_RADIUS;
                             ball.vx = -Math.abs(ball.vx) * WALL_RESTITUTION;
                        } else {
                             ball.x = sep.x + sep.w + BALL_RADIUS;
                             ball.vx = Math.abs(ball.vx) * WALL_RESTITUTION;
                        }
                    }
                }
            }

            // -- BUCKET FLOOR / LANDING --
            const bucketY = state.current.buckets[0]?.y || height - 50;
            const floorY = bucketY + 30; // Bottom of bucket

            // Check if entered bucket zone (top of separators)
            if (ball.y > bucketY && !ball.landing) {
                ball.landing = true; // Stop colliding with pegs, focus on settling
            }

            // Floor Collision
            if (ball.y > floorY - BALL_RADIUS) {
                ball.y = floorY - BALL_RADIUS;
                ball.vy *= -0.3; // Low bounce on floor
                ball.vx *= 0.8; // High friction on floor
                
                // Snap to center if slow enough
                if (Math.abs(ball.vx) < 0.5 && Math.abs(ball.vy) < 0.5) {
                   ball.settled = true;
                   onAnimationComplete();
                }
            }
        } else {
            // Settle Animation
            // Move ball to exact center of the bucket it landed in
            // Shrink and fade
            ball.scale *= 0.9;
            if (ball.scale < 0.1) ball.active = false;
        }

        // Trail
        if (!ball.settled) {
             state.current.ball.history.push({x: ball.x, y: ball.y});
             if (state.current.ball.history.length > 15) state.current.ball.history.shift();
        }
      }

      // 3. Render
      
      // Draw Buckets
      state.current.buckets.forEach((bucket, i) => {
         const isActive = ball.active && ball.landing && Math.abs(ball.x - (bucket.x + bucket.w/2)) < bucket.w/2;
         const isTarget = ball.settled && Math.abs(ball.x - (bucket.x + bucket.w/2)) < bucket.w/2;

         // Determine Color
         let baseColor = '#1e293b';
         let accentColor = '#334155';
         let textColor = '#94a3b8';
         
         if (bucket.val >= 10) { baseColor = '#450a0a'; accentColor = '#ef4444'; textColor = '#fca5a5'; }
         else if (bucket.val >= 3) { baseColor = '#431407'; accentColor = '#f97316'; textColor = '#fdba74'; }
         else if (bucket.val >= 1.5) { baseColor = '#172554'; accentColor = '#3b82f6'; textColor = '#bfdbfe'; }

         // Glow if target or active
         if (isTarget) {
             ctx.shadowColor = accentColor;
             ctx.shadowBlur = 20;
             baseColor = accentColor;
             textColor = '#fff';
         }

         // Fill Bucket
         ctx.fillStyle = baseColor;
         ctx.beginPath();
         // "Cup" shape - wider top, narrower bottom slightly? No, standard rect is cleaner for UI
         ctx.roundRect(bucket.x + 2, bucket.y, bucket.w - 4, bucket.h, [0, 0, 12, 12]);
         ctx.fill();
         ctx.shadowBlur = 0;

         // Top accent line
         ctx.fillStyle = accentColor;
         ctx.fillRect(bucket.x + 2, bucket.y, bucket.w - 4, 3);

         // Text
         ctx.fillStyle = textColor;
         ctx.font = `bold ${isTarget ? '14px' : '11px'} Inter`;
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText(`${bucket.val}x`, bucket.x + bucket.w/2, bucket.y + bucket.h/2 + 2);
      });

      // Draw Separators (Visual)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      state.current.separators.forEach(sep => {
          ctx.fillRect(sep.x, sep.y, sep.w, sep.h);
      });

      // Draw Pegs
      state.current.pegs.forEach(peg => {
         ctx.beginPath();
         ctx.arc(peg.x, peg.y, peg.r, 0, Math.PI * 2);
         ctx.fillStyle = COLORS.peg;
         
         // Interaction Glow
         if (ball.active && !ball.settled) {
             const dist = (ball.x - peg.x)**2 + (ball.y - peg.y)**2;
             if (dist < 800) {
                 ctx.shadowColor = 'white';
                 ctx.shadowBlur = 8;
                 ctx.fillStyle = '#fff';
             }
         }
         ctx.fill();
         ctx.shadowBlur = 0;
      });

      // Draw Ball
      if (ball.active) {
         const cx = ball.x;
         const cy = ball.y;
         const r = BALL_RADIUS * ball.scale;

         // Trail
         if (!ball.settled && ball.history.length > 1) {
             ctx.beginPath();
             ctx.moveTo(ball.history[0].x, ball.history[0].y);
             for (let k = 1; k < ball.history.length; k++) ctx.lineTo(ball.history[k].x, ball.history[k].y);
             ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 * ball.scale})`;
             ctx.lineWidth = 4 * ball.scale;
             ctx.lineCap = 'round';
             ctx.stroke();
         }

         ctx.beginPath();
         ctx.arc(cx, cy, r, 0, Math.PI * 2);
         ctx.fillStyle = COLORS.ball;
         ctx.shadowColor = COLORS.ball;
         ctx.shadowBlur = 15 * ball.scale;
         ctx.fill();
         ctx.shadowBlur = 0;

         // White Core
         ctx.fillStyle = '#fff';
         ctx.beginPath();
         ctx.arc(cx - r*0.3, cy - r*0.3, r*0.4, 0, Math.PI*2);
         ctx.fill();
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

  }, [rows, risk, path]); // Re-init on settings change

  return (
    <div ref={containerRef} className="flex-1 w-full relative overflow-hidden bg-slate-900 shadow-inner cursor-pointer">
      <canvas ref={canvasRef} className="block w-full h-full" />
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.4)_100%)]"></div>
    </div>
  );
};