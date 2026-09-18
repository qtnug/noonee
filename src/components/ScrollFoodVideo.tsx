'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface ScrollFoodVideoProps {
  totalFrames?: number;
  className?: string;
}

export default function ScrollFoodVideo({
  totalFrames = 100,
  className = '',
}: ScrollFoodVideoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const isLoadedRef = useRef<boolean[]>([]);
  const currentFrameRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startFrameRef = useRef<number>(0);

  // Format frame path: /video/frame_0001.png to /video/frame_0100.png
  const getFrameUrl = useCallback((index: number) => {
    const frameNumber = String(index + 1).padStart(4, '0');
    return `/video/frame_${frameNumber}.png`;
  }, []);

  // Draw specific frame onto canvas
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let img = imagesRef.current[frameIndex];
    if (!img || !isLoadedRef.current[frameIndex]) {
      let closestIdx = -1;
      let minDiff = Infinity;
      for (let i = 0; i < totalFrames; i++) {
        if (isLoadedRef.current[i] && imagesRef.current[i]) {
          const diff = Math.abs(i - frameIndex);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          }
        }
      }
      if (closestIdx !== -1) {
        img = imagesRef.current[closestIdx];
      }
    }

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }, [totalFrames]);

  // Preload images
  useEffect(() => {
    imagesRef.current = new Array(totalFrames).fill(null);
    isLoadedRef.current = new Array(totalFrames).fill(false);

    // 1. Load first frame immediately
    const firstImg = new Image();
    firstImg.src = getFrameUrl(0);
    firstImg.onload = () => {
      imagesRef.current[0] = firstImg;
      isLoadedRef.current[0] = true;
      drawFrame(0);
    };

    // 2. Preload remaining frames in background
    for (let i = 1; i < totalFrames; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);
      img.onload = () => {
        imagesRef.current[i] = img;
        isLoadedRef.current[i] = true;
        if (currentFrameRef.current === i) {
          drawFrame(i);
        }
      };
    }

    return () => {
      imagesRef.current = [];
      isLoadedRef.current = [];
    };
  }, [totalFrames, getFrameUrl, drawFrame]);

  // Update frame with bounds check
  const setFrame = useCallback((newFrame: number) => {
    const clamped = Math.max(0, Math.min(totalFrames - 1, Math.round(newFrame)));
    if (clamped !== currentFrameRef.current) {
      currentFrameRef.current = clamped;
      requestAnimationFrame(() => drawFrame(clamped));
    }
  }, [totalFrames, drawFrame]);

  // Handle Page Scroll Animation
  useEffect(() => {
    const handleScroll = () => {
      if (isDraggingRef.current) return;

      const container = containerRef.current;
      if (!container) return;

      const scrollY = window.scrollY || window.pageYOffset;
      const startScroll = 0;
      const endScroll = 650;

      const progress = Math.min(1, Math.max(0, (scrollY - startScroll) / (endScroll - startScroll)));
      const targetFrame = Math.floor(progress * (totalFrames - 1));

      setFrame(targetFrame);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [totalFrames, setFrame]);

  // Handle Mouse / Touch Drag to rotate
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startFrameRef.current = currentFrameRef.current;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    const frameDelta = -Math.floor(deltaX / 4);
    let target = (startFrameRef.current + frameDelta) % totalFrames;
    if (target < 0) target += totalFrames;
    setFrame(target);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].clientX;
    startFrameRef.current = currentFrameRef.current;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - startXRef.current;
    const frameDelta = -Math.floor(deltaX / 4);
    let target = (startFrameRef.current + frameDelta) % totalFrames;
    if (target < 0) target += totalFrames;
    setFrame(target);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[16/9] bg-transparent cursor-grab active:cursor-grabbing select-none flex items-center justify-center ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="w-full h-full object-contain pointer-events-none drop-shadow-md"
      />
    </div>
  );
}
