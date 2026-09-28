'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ScrollFoodVideoProps {
  totalFrames?: number;
  className?: string;
  dishName?: string;
  priceText?: string;
}

export default function ScrollFoodVideo({
  totalFrames = 100,
  className = '',
  dishName = 'Bún Bò Huế',
  priceText = '42.000đ',
}: ScrollFoodVideoProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const isLoadedRef = useRef<boolean[]>([]);
  const currentFrameRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startFrameRef = useRef<number>(0);

  // Dish hover state (only triggers when mouse is over actual dish pixels)
  const [isHoveringDish, setIsHoveringDish] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Format frame path from transparent frames folder: /frames_clean/frame_0001.png?v=2
  const getFrameUrl = useCallback((index: number) => {
    const frameNumber = String(index + 1).padStart(4, '0');
    return `/frames_clean/frame_${frameNumber}.png?v=2`;
  }, []);

  // Draw specific frame onto canvas
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
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

  // Preload transparent images
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

  // Pixel-perfect Hit Testing: Detect if cursor is directly over the dish (Alpha > 25)
  const checkDishPixelUnderCursor = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    if (relX < 0 || relX > rect.width || relY < 0 || relY > rect.height) {
      setIsHoveringDish(false);
      return;
    }

    // Map CSS pixel to canvas 1280x720 coordinates
    const canvasX = Math.floor(relX * (canvas.width / rect.width));
    const canvasY = Math.floor(relY * (canvas.height / rect.height));

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    try {
      const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
      // pixel[3] is Alpha (0 = transparent background, >25 = actual dish pixel)
      if (pixel[3] > 25) {
        setIsHoveringDish(true);
        setMousePos({ x: relX, y: relY });
      } else {
        setIsHoveringDish(false);
      }
    } catch {
      setIsHoveringDish(false);
    }
  };

  // Handle Mouse / Touch Drag to rotate
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startFrameRef.current = currentFrameRef.current;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Check if hovering on actual dish
    checkDishPixelUnderCursor(e);

    // 2. If dragging, rotate frame
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

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setIsHoveringDish(false);
  };

  // Mobile Touch Support
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

  const handleClick = () => {
    if (isHoveringDish) {
      router.push('/product/bun-bo-hue');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[16/9] bg-transparent select-none flex items-center justify-center ${
        isHoveringDish ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
      } ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      title={isHoveringDish ? 'Bấm để xem Bún Bò Huế' : undefined}
    >
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className={`w-full h-full object-contain pointer-events-none transition-all duration-300 ease-out ${
          isHoveringDish
            ? '-translate-y-2.5 scale-[1.05] filter drop-shadow-[0_0_35px_rgba(163, 0, 41,0.7)] drop-shadow-[0_16px_40px_rgba(249,115,22,0.45)]'
            : 'translate-y-0 scale-100 filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
        }`}
      />

      {/* Hover Popup: ONLY displays when hovering directly over the dish */}
      {isHoveringDish && (
        <div
          className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full pb-4 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
          }}
        >
          <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-[12px] shadow-2xl border-2 border-[#A30029] flex items-center gap-3 whitespace-nowrap">
            <div className="w-3 h-3 rounded-full bg-[#A30029] animate-ping shrink-0" />
            <div className="space-y-0.5">
              <div className="text-[14px] font-bold text-[#181d26] leading-tight flex items-center gap-1.5">
                <span>{dishName}</span>
                <span className="text-[10px] font-medium text-[#A30029] bg-[#fff1f2] px-1.5 py-0.5 rounded-[4px] border border-[#fecdd3]">
                  Xem chi tiết →
                </span>
              </div>
              <div className="text-[13px] font-extrabold text-[#A30029] leading-none">
                {priceText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
