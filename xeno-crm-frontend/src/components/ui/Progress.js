import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

// ShadCN-inspired Progress component with GSAP animation
const Progress = ({
  value = 0,
  max = 100,
  color = 'primary',
  size = 'default',
  showValue = false,
  className,
  ...props
}) => {
  const progressRef = useRef(null);
  const progressValueRef = useRef(null);
  
  // Base styles
  const baseStyles = 'relative h-4 w-full overflow-hidden rounded-full bg-secondary/20';
  
  // Size styles
  const sizeStyles = {
    sm: 'h-2',
    default: 'h-4',
    lg: 'h-6',
  };
  
  // Color styles for the indicator
  const colorStyles = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
  };
  
  // Calculate percentage
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  
  // GSAP animation for smooth progress
  useEffect(() => {
    if (progressValueRef.current) {
      gsap.to(progressValueRef.current, {
        width: `${percent}%`,
        duration: 0.8,
        ease: 'power2.out',
      });
    }
  }, [percent]);
  
  // Combine styles
  const containerStyles = `${baseStyles} ${sizeStyles[size] || sizeStyles.default} ${className || ''}`;
  const indicatorStyles = `h-full w-full flex-1 transition-all ${colorStyles[color] || colorStyles.primary}`;
  
  return (
    <div className="flex w-full flex-col gap-2">
      <div ref={progressRef} className={containerStyles} {...props}>
        <div
          ref={progressValueRef}
          className={indicatorStyles}
          style={{ width: '0%' }} // Initial width, will be animated by GSAP
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showValue && (
        <div className="text-right text-xs text-muted-foreground">
          {percent.toFixed(0)}%
        </div>
      )}
    </div>
  );
};

export default Progress;
