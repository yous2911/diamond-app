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
    primary: 'bg-cognitive-gold text-text-dark hover:shadow-glow hover:scale-105',
    secondary: 'bg-transparent border-2 border-text-dark/30 text-text-dark hover:bg-text-dark/5 hover:border-cognitive-gold',
    ghost: 'bg-transparent text-text-medium hover:text-text-dark',
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}





