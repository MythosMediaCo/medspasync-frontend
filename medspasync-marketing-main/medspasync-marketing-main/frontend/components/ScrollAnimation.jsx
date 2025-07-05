
import React, { useEffect, useRef, useState } from 'react';

const ScrollAnimation = ({ 
  children, 
  animation = 'fade-in',
  delay = 0,
  threshold = 0.1,
  className = '',
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [delay, threshold]);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-700 ease-out';
    
    switch (animation) {
      case 'fade-in':
        return `${baseClasses} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`;
      case 'slide-up':
        return `${baseClasses} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`;
      case 'slide-left':
        return `${baseClasses} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`;
      case 'slide-right':
        return `${baseClasses} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`;
      case 'scale-in':
        return `${baseClasses} ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`;
      case 'rotate-in':
        return `${baseClasses} ${isVisible ? 'opacity-100 rotate-0' : 'opacity-0 rotate-12'}`;
      case 'bounce-in':
        return `${baseClasses} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`;
      default:
        return `${baseClasses} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`;
    }
  };

  return (
    <div
      ref={elementRef}
      className={`${getAnimationClasses()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Staggered animation wrapper
export const StaggeredAnimation = ({ 
  children, 
  staggerDelay = 100,
  animation = 'fade-in',
  className = '',
  ...props 
}) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={className} {...props}>
      {childrenArray.map((child, index) => (
        <ScrollAnimation
          key={index}
          animation={animation}
          delay={index * staggerDelay}
          className="mb-4"
        >
          {child}
        </ScrollAnimation>
      ))}
    </div>
  );
};

// Parallax effect component
export const ParallaxElement = ({ 
  children, 
  speed = 0.5,
  className = '',
  ...props 
}) => {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = scrolled * -speed;
        setOffset(rate);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      ref={elementRef}
      className={`transform ${className}`}
      style={{ transform: `translateY(${offset}px)` }}
      {...props}
    >
      {children}
    </div>
  );
};

// Floating animation component
export const FloatingElement = ({ 
  children, 
  duration = 6,
  delay = 0,
  className = '',
  ...props 
}) => {
  return (
    <div
      className={`animate-float ${className}`}
      style={{ 
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// Morphing shape component
export const MorphingShape = ({ 
  className = '',
  size = 'w-32 h-32',
  color = 'bg-gradient-to-br from-purple-400 to-pink-400',
  ...props 
}) => {
  return (
    <div
      className={`shape-abstract ${size} ${color} ${className}`}
      {...props}
    />
  );
};

// 3D Card component
export const Card3D = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <div
      className={`card-3d card-3d-hover ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Glassmorphism card component
export const GlassCard = ({ 
  children, 
  className = '',
  dark = false,
  ...props 
}) => {
  return (
    <div
      className={`${dark ? 'glass-dark' : 'glass'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default ScrollAnimation; 