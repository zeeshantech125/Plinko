import { MULTIPLIERS } from '../constants';
import { RiskLevel } from '../types';

/**
 * Simulates server-side logic for "Provably Fair" outcomes.
 */
export const calculateOutcome = (rowCount: number, risk: RiskLevel) => {
  const multipliers = MULTIPLIERS[rowCount][risk];
  const bucketCount = rowCount + 1; // 8 rows -> 9 buckets
  
  // Gaussian-like distribution simulation
  // We want a natural bell curve, clamped to 0..1
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); 
  while(v === 0) v = Math.random();
  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  
  // Standard Deviation 0.15 puts most results in middle
  // Mean 0.5
  num = num / 6.0 + 0.5; 
  if (num > 1 || num < 0) num = Math.random(); // Fallback to flat random if outlier
  
  // Map to bucket index
  const bucketIndex = Math.floor(num * bucketCount);
  const finalIndex = Math.max(0, Math.min(bucketCount - 1, bucketIndex));
  
  // For the physics engine, we need a path of 'decisions' (Left=0, Right=1)
  // that results in this finalIndex.
  // In a pyramid of N rows, getting to bucket K requires K 'Right' moves.
  const path = generatePath(rowCount, finalIndex);
  
  return {
    bucketIndex: finalIndex,
    multiplier: multipliers[finalIndex],
    path
  };
};

/**
 * Generates a specific path of Left/Right moves to reach a target bucket.
 * The physics engine uses this to "nudge" the ball.
 */
const generatePath = (rows: number, targetBucket: number): number[] => {
  // We need exactly 'targetBucket' number of Rights (1s).
  // The rest must be Lefts (0s).
  const directions = new Array(rows).fill(0);
  
  // Fill the required number of Rights
  for(let i=0; i<targetBucket; i++) {
    directions[i] = 1;
  }
  
  // Shuffle randomly to make the path look organic
  // Fisher-Yates shuffle
  for (let i = directions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [directions[i], directions[j]] = [directions[j], directions[i]];
  }
  
  return directions;
};
