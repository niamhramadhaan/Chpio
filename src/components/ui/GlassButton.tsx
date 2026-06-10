import { type ReactNode } from 'react';

interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const variants = {
  default: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
  accent: 'bg-teal-400/20 hover:bg-teal-400/30 text-teal-400 border border-teal-400/30',
  ghost: 'bg-transparent hover:bg-white/5 text-white/60 hover:text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export function GlassButton({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false,
}: GlassButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`transition-all duration-200 ease-out font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
