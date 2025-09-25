'use client';
import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

export default function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = 'px-6 sm:px-8 py-3 font-sora font-bold text-lg rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cognitive-gold/60';
  const styles: Record<Variant, string> = {
    primary: 'bg-cognitive-gold text-deep-space hover:shadow-glow',
    secondary: 'bg-transparent border border-white/30 text-white hover:bg-white/10',
    ghost: 'bg-transparent text-white/80 hover:text-white',
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}









