'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { MousePointer, ArrowRight, RotateCw, Sparkles, Utensils, Star } from 'lucide-react';
import { formatVND } from '@/lib/utils';

interface ScrollFoodVideoProps {
  totalFrames?: number;
  dishName?: string;
  price?: number;
  dishCategory?: string;
}

export default function ScrollFoodVideo({
  totalFrames = 100,
  dishName = 'Bún Bò Huế Cay Nồng Đặc Biệt',
  price = 42000,
  dishCategory = 'Món Nước Nóng Hổi',
}: ScrollFoodVideoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const isLoadedRef = useRef<boolean[]>([]);
  const currentFrameRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startFrameRef = useRef<number>(0);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

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

    // Find requested frame or fallback to closest loaded frame
    let img = imagesRef.current[frameIndex];
    if (!img || !isLoadedRef.current[frameIndex]) {
      // Find closest loaded frame
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
      // Clear canvas and draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }, [totalFrames]);

  // Preload images
  useEffect(() => {
    imagesRef.current = new Array(totalFrames).fill(null);
    isLoadedRef.current = new Array(totalFrames).fill(false);

    let loadedCount = 0;

    // 1. Load first frame immediately with top priority
    const firstImg = new Image();
    firstImg.src = getFrameUrl(0);
    firstImg.onload = () => {
      imagesRef.current[0] = firstImg;
      isLoadedRef.current[0] = true;
      loadedCount++;
      setIsReady(true);
      drawFrame(0);
    };

    // 2. Preload remaining frames in background
    for (let i = 1; i < totalFrames; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);
      img.onload = () => {
        imagesRef.current[i] = img;
        isLoadedRef.current[i] = true;
        loadedCount++;
        setLoadProgress(Math.round((loadedCount / totalFrames) * 100));

        // Re-draw current frame if this frame just finished loading
        if (currentFrameRef.current === i) {
          drawFrame(i);
        }
      };
    }

    return () => {
      // Cleanup references
      imagesRef.current = [];
      isLoadedRef.current = [];
    };
  }, [totalFrames, getFrameUrl, drawFrame]);

  // Update frame with bounds check & UI state
  const setFrame = useCallback((newFrame: number) => {
    const clamped = Math.max(0, Math.min(totalFrames - 1, Math.round(newFrame)));
    if (clamped !== currentFrameRef.current) {
      currentFrameRef.current = clamped;
      setCurrentFrame(clamped);
      requestAnimationFrame(() => drawFrame(clamped));
    }
  }, [totalFrames, drawFrame]);

  // Handle Page Scroll Animation
  useEffect(() => {
    const handleScroll = () => {
      // If user is actively dragging the image, ignore scroll to prevent conflict
      if (isDraggingRef.current) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate scroll progress through hero section
      // Animation starts when top of container reaches 85% of viewport
      // and completes when container leaves or scrolls past 500px
      const scrollY = window.scrollY || window.pageYOffset;
      const startScroll = 0;
      const endScroll = 650; // Scroll range in pixels to complete full 360 rotation

      const progress = Math.min(1, Math.max(0, (scrollY - startScroll) / (endScroll - startScroll)));
      const targetFrame = Math.floor(progress * (totalFrames - 1));

      setFrame(targetFrame);
      if (scrollY > 30) {
        setUserInteracted(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [totalFrames, setFrame]);

  // Handle Mouse / Touch Drag to Rotate 360
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startFrameRef.current = currentFrameRef.current;
    setUserInteracted(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    // Drag sensitivity: 4px per frame
    const frameDelta = -Math.floor(deltaX / 4);
    let target = (startFrameRef.current + frameDelta) % totalFrames;
    if (target < 0) target += totalFrames;
    setFrame(target);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch support for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].clientX;
    startFrameRef.current = currentFrameRef.current;
    setUserInteracted(true);
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

  // Rotation degrees (0 to 360)
  const rotationDeg = Math.round((currentFrame / (totalFrames - 1)) * 360);

  return (
    <div
      ref={containerRef}
      className="bg-[#0f172a] rounded-[20px] p-3 sm:p-5 border-2 border-[#334155] shadow-xl relative overflow-hidden text-white flex flex-col justify-between"
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#e31837] text-white text-[11px] font-bold tracking-wide uppercase">
            <Sparkles className="w-3 h-3 animate-spin" />
            360° Cuộn để xoay
          </span>
          <span className="text-[12px] text-slate-300 font-medium hidden sm:inline">
            {dishCategory}
          </span>
        </div>

        {/* Real-time Rotation & Frame Indicator */}
        <div className="flex items-center gap-2 text-right">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-mono bg-white/10 px-2 py-0.5 rounded-[4px] border border-white/10">
            <RotateCw className="w-3 h-3 text-[#e31837] animate-pulse" />
            {rotationDeg}°
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {currentFrame + 1}/{totalFrames}
          </span>
        </div>
      </div>

      {/* Main Video Canvas Area (Supports Drag + Scroll) */}
      <div
        className="relative w-full aspect-[16/9] my-2 rounded-[14px] overflow-hidden bg-black flex items-center justify-center cursor-grab active:cursor-grabbing select-none group"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        title="Cuộn trang hoặc kéo chuột trái để xoay 360°"
      >
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Scroll / Drag Interaction Hint (Fades out after user scrolls) */}
        {!userInteracted && (
          <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none bg-gradient-to-t from-black/70 via-transparent to-transparent">
            <div className="bg-black/80 backdrop-blur-md text-white text-[12px] font-medium px-4 py-1.5 rounded-full border border-white/20 flex items-center gap-2 shadow-lg animate-bounce">
              <MousePointer className="w-3.5 h-3.5 text-[#e31837]" />
              <span>Cuộn chuột xuống hoặc vuốt để xoay món ăn</span>
            </div>
          </div>
        )}

        {/* Mini scrub handle on hover */}
        <div className="absolute bottom-2 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex justify-between items-center text-[10px] text-white/70 bg-black/60 px-2.5 py-1 rounded-md">
          <span>Kéo sang trái/phải để xoay thủ công</span>
          <span className="text-[#f87171] font-semibold">{rotationDeg}°</span>
        </div>
      </div>

      {/* Scroll Progress Bar */}
      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-3">
        <div
          className="bg-gradient-to-r from-[#e31837] to-[#f43f5e] h-full transition-all duration-75 ease-out rounded-full"
          style={{ width: `${((currentFrame + 1) / totalFrames) * 100}%` }}
        />
      </div>

      {/* Bottom Dish Details & Action */}
      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] sm:text-[17px] font-bold text-white leading-tight">
              {dishName}
            </h3>
            <div className="flex items-center text-amber-400 text-[12px] shrink-0">
              <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
              <span>5.0</span>
            </div>
          </div>
          <p className="text-[14px] font-extrabold text-[#f43f5e]">
            {formatVND(price)}
          </p>
        </div>

        <Link
          href="/menu"
          className="h-9 px-4 rounded-[8px] bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a60b20] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Đặt món này ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
