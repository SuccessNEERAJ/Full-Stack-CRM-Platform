import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

// ShadCN-inspired Card component with GSAP animations
const Card = ({
  children,
  variant = 'default',
  hover = true,
  className,
  ...props
}) => {
  const cardRef = useRef(null);
  
  // Base styles
  const baseStyles = 'rounded-lg border bg-card text-card-foreground shadow-sm';
  
  // Variant styles
  const variantStyles = {
    default: 'bg-white',
    primary: 'bg-primary/5 border-primary/20',
    secondary: 'bg-secondary/5 border-secondary/20',
    accent: 'bg-accent border-accent/20',
    destructive: 'bg-destructive/5 border-destructive/20',
  };
  
  // Hover effect with GSAP
  useEffect(() => {
    if (hover && cardRef.current) {
      const card = cardRef.current;
      
      const enterAnimation = () => {
        gsap.to(card, {
          y: -5,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          duration: 0.3,
          ease: 'power2.out'
        });
      };
      
      const leaveAnimation = () => {
        gsap.to(card, {
          y: 0,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          duration: 0.3,
          ease: 'power2.out'
        });
      };
      
      card.addEventListener('mouseenter', enterAnimation);
      card.addEventListener('mouseleave', leaveAnimation);
      
      return () => {
        card.removeEventListener('mouseenter', enterAnimation);
        card.removeEventListener('mouseleave', leaveAnimation);
      };
    }
  }, [hover]);
  
  // Combine all styles
  const cardStyles = `${baseStyles} ${variantStyles[variant] || variantStyles.default} ${className || ''}`;
  
  // Animation variants for initial render
  const cardAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  };
  
  return (
    <motion.div
      ref={cardRef}
      className={cardStyles}
      {...cardAnimation}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Card subcomponents
const CardHeader = ({ className, children, ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className || ''}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className, children, ...props }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ className, children, ...props }) => (
  <p className={`text-sm text-muted-foreground ${className || ''}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ className, children, ...props }) => (
  <div className={`p-6 pt-0 ${className || ''}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ className, children, ...props }) => (
  <div className={`flex items-center p-6 pt-0 ${className || ''}`} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
