import React from 'react';
import { motion } from 'framer-motion';
import 'remixicon/fonts/remixicon.css';

// ShadCN-inspired button component with animations
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  icon, 
  iconPosition = 'left',
  onClick,
  disabled,
  className,
  ...props 
}) => {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-primary hover:bg-primary/90 text-white shadow',
    secondary: 'bg-secondary hover:bg-secondary/90 text-white',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  };
  
  // Size styles
  const sizeStyles = {
    small: 'h-8 px-3 text-xs',
    medium: 'h-10 px-4 py-2',
    large: 'h-12 px-6 py-3 text-lg',
    icon: 'h-10 w-10',
  };
  
  // Animation properties
  const buttonAnimation = {
    whileTap: { scale: 0.98 },
    whileHover: { scale: 1.02 },
    transition: { type: 'spring', stiffness: 400, damping: 17 }
  };

  // Combine all styles
  const buttonStyles = `${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.medium} ${className || ''}`;
  
  return (
    <motion.button
      className={buttonStyles}
      onClick={onClick}
      disabled={disabled}
      {...buttonAnimation}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <i className={`ri-${icon} ${children ? 'mr-2' : ''}`}></i>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <i className={`ri-${icon} ${children ? 'ml-2' : ''}`}></i>
      )}
    </motion.button>
  );
};

export default Button;
