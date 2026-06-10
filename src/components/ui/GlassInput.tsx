import { type InputHTMLAttributes } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function GlassInput({ label, className = '', ...props }: GlassInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-white/50 text-sm font-medium">{label}</label>
      )}
      <input
        {...props}
        className={`bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 transition-all duration-300 ${className}`}
      />
    </div>
  );
}
