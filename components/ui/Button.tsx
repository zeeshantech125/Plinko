import React from 'react';
import { audioService } from '../../services/audioService';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  onClick,
  disabled,
  ...props 
}) => {
  
  const baseStyles = "font-bold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg";
  
  const variants = {
    primary: "bg-primary hover:bg-blue-600 text-white shadow-neon-blue",
    secondary: "bg-secondary hover:bg-emerald-600 text-white shadow-neon-green",
    accent: "bg-accent hover:bg-amber-600 text-white shadow-orange-500/50",
    danger: "bg-danger hover:bg-red-600 text-white",
    ghost: "bg-transparent hover:bg-white/10 text-gray-300 shadow-none",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  const width = fullWidth ? "w-full" : "";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      audioService.playClick();
      onClick?.(e);
    }
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
