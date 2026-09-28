'use client';

import React, { useEffect, useRef, useState } from 'react';

export type RevealAnimation =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'fade-in'
  | 'zoom-in';

export interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: RevealAnimation;
  delay?: number; // Delay in milliseconds
  duration?: number; // Duration in milliseconds
  threshold?: number; // IntersectionObserver threshold (0 to 1)
  className?: string;
  style?: React.CSSProperties;
  once?: boolean;
  as?: React.ElementType;
}

export default function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 650,
  threshold = 0.08,
  className = '',
  style: customStyle = {},
  once = true,
  as: Component = 'div',
}: ScrollRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect user's reduced motion setting
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsRevealed(true);
      return;
    }

    const node = elementRef.current;
    if (!node) return;

    if (!('IntersectionObserver' in window)) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsRevealed(true);
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            setIsRevealed(false);
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px -25px 0px',
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, once]);

  const getInitialTransform = (): string => {
    switch (animation) {
      case 'fade-up':
        return 'translate3d(0, 28px, 0)';
      case 'fade-down':
        return 'translate3d(0, -28px, 0)';
      case 'fade-left':
        return 'translate3d(-28px, 0, 0)';
      case 'fade-right':
        return 'translate3d(28px, 0, 0)';
      case 'zoom-in':
        return 'scale3d(0.94, 0.94, 1)';
      case 'fade-in':
      default:
        return 'none';
    }
  };

  const dynamicStyle: React.CSSProperties = {
    opacity: isRevealed ? 1 : 0,
    transform: isRevealed ? 'none' : getInitialTransform(),
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: 'opacity, transform',
    ...customStyle,
  };

  const Tag = Component as any;

  return (
    <Tag ref={elementRef} style={dynamicStyle} className={className}>
      {children}
    </Tag>
  );
}
