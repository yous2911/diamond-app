/**
 * Accessible Button Component
 * 
 * Implements all accessibility best practices:
 * - Semantic button element
 * - Proper ARIA attributes
 * - Keyboard navigation support
 * - Focus management
 * - Loading and disabled states
 */

import React from 'react';
import { motion } from 'framer-motion';

interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantClasses = {
    primary: `
      bg-blue-600 text-white border border-blue-600
      hover:bg-blue-700 hover:border-blue-700
      focus:ring-blue-500
      active:bg-blue-800
    `,
    secondary: `
      bg-white text-blue-600 border border-blue-600
      hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700
      focus:ring-blue-500
      active:bg-blue-100
    `,
    ghost: `
      bg-transparent text-gray-600 border border-transparent
      hover:bg-gray-100 hover:text-gray-700
      focus:ring-gray-500
      active:bg-gray-200
    `,
    danger: `
      bg-red-600 text-white border border-red-600
      hover:bg-red-700 hover:border-red-700
      focus:ring-red-500
      active:bg-red-800
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.1 }}
    >
      {/* Loading Spinner */}
      {loading && (
        <svg 
          className={`animate-spin -ml-1 mr-3 ${iconSizeClasses[size]}`}
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          role="img"
          aria-label="Loading"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Left Icon */}
      {icon && iconPosition === 'left' && !loading && (
        <span className={`${children ? 'mr-2' : ''} ${iconSizeClasses[size]}`}>
          {icon}
        </span>
      )}

      {/* Button Text */}
      {children && (
        <span>{children}</span>
      )}

      {/* Right Icon */}
      {icon && iconPosition === 'right' && !loading && (
        <span className={`${children ? 'ml-2' : ''} ${iconSizeClasses[size]}`}>
          {icon}
        </span>
      )}
    </motion.button>
  );
};

export default AccessibleButton;