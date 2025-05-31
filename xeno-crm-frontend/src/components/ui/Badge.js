import React from 'react';
import { motion } from 'framer-motion';

// ShadCN-inspired Badge component with animations
const Badge = ({
  children,
  variant = 'default',
  size = 'default',
  className,
  ...props
}) => {
  // Base styles
  const baseStyles = 'inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  // Variant styles
  const variantStyles = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground',
    success: 'border-transparent bg-green-500 text-white hover:bg-green-600',
    warning: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
    info: 'border-transparent bg-blue-500 text-white hover:bg-blue-600',
  };
  
  // Size styles
  const sizeStyles = {
    default: 'px-2.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };
  
  // Animation properties
  const badgeAnimation = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.2 }
  };
  
  // Combine all styles
  const badgeStyles = `${baseStyles} ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.default} ${className || ''}`;
  
  return (
    <motion.span
      className={badgeStyles}
      {...badgeAnimation}
      {...props}
    >
      {children}
    </motion.span>
  );
};

export default Badge;
