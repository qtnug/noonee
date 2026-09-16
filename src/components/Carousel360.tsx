"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const DEFAULT_FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80", // Cơm tấm sườn bì chả
  "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=700&q=80", // Phở bò
  "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&w=700&q=80", // Bún chả
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=80", // Bún bò Huế
  "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=700&q=80", // Bánh mì
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80", // Nem rán
  "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=700&q=80", // Cơm gà
  "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=700&q=80", // Trà sữa
  "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=700&q=80", // Cà phê phin
  "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80", // Cơm rang
];

// How often the carousel auto-rotates (ms)
const AUTOPLAY_INTERVAL_MS = 2800;

// Spring physics for the ring rotation
const springTransition = {
  type: "spring",
  stiffness: 60,
  damping: 16,
  mass: 0.7,
} as const;

// Ring depth bounds
const RADIUS_MIN = 110;
const RADIUS_MAX = 200;
const RADIUS_WIDTH_RATIO = 0.45;
const PERSPECTIVE_MULTIPLIER = 2.2;
const RING_TILT_DEG = 30;

// Center image crossfade
const CROSSFADE_DURATION_S = 0.45;
const CROSSFADE_EASE = [0.22, 1, 0.36, 1] as const;

// Size classes — thumbnails on the ring
const THUMB_SIZE_CLASSES = "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14";
const THUMB_SIZES_ATTR = "(max-width: 640px) 40px, (max-width: 768px) 48px, 56px";

// Size classes — active center image
const CENTER_SIZE_CLASSES = "w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48";
const CENTER_SIZES_ATTR = "(max-width: 640px) 144px, (max-width: 768px) 176px, 192px";

// Nav button size
const BUTTON_SIZE_CLASSES = "w-8 h-8 sm:w-9 sm:h-9";

const ImageLoader: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black/5">
    <div className="w-1/4 aspect-square rounded-full border-2 border-black/15 border-t-[#e31837] animate-spin" />
  </div>
);

interface Carousel360Props {
  images?: string[];
}

export const Carousel360: React.FC<Carousel360Props> = ({ images = DEFAULT_FOOD_IMAGES }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [radius, setRadius] = useState(150);
  const [loadedThumbs, setLoadedThumbs] = useState<boolean[]>(() =>
    images.map(() => false)
  );

  const numImages = images.length;
  const angleStep = 360 / numImages;

  const steps = Math.round(rotation / angleStep);
  const centerIndex = ((-steps % numImages) + numImages) % numImages;
  const centerImage = images[centerIndex];

  const [prevCenterIndex, setPrevCenterIndex] = useState(centerIndex);
  const [centerLoaded, setCenterLoaded] = useState(false);
  if (centerIndex !== prevCenterIndex) {
    setPrevCenterIndex(centerIndex);
    setCenterLoaded(false);
  }

  useEffect(() => {
    const updateRadius = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      setRadius(
        Math.max(RADIUS_MIN, Math.min(RADIUS_MAX, width * RADIUS_WIDTH_RATIO))
      );
    };
    updateRadius();
    window.addEventListener("resize", updateRadius);
    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => prev + angleStep);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [angleStep]);

  const rotateCarousel = useCallback(
    (direction: "left" | "right") => {
      setRotation(
        (prev) => prev + (direction === "left" ? -angleStep : angleStep)
      );
    },
    [angleStep]
  );

  const markThumbLoaded = useCallback((index: number) => {
    setLoadedThumbs((prev) => {
      if (prev[index]) return prev;
      const next = [...prev];
      next[index] = true;
      return next;
    });
  }, []);

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none py-2 sm:py-4">
      <div
        ref={containerRef}
        className="relative w-[96%] max-w-[420px] aspect-[4/3] flex items-center justify-center"
      >
        <div
          className="relative w-full h-full"
          style={{ perspective: radius * PERSPECTIVE_MULTIPLIER }}
        >
          {images.map((item, index) => {
            const targetAngle = rotation + angleStep * index;
            return (
              <motion.div
                key={item + index}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: targetAngle }}
                transition={springTransition}
              >
                <motion.div
                  className="relative rounded-lg sm:rounded-xl overflow-hidden shadow-[0_4px_14px_rgba(0,0,0,0.12)] border border-white/80 bg-white"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{
                    rotateY: -targetAngle,
                    rotateX: RING_TILT_DEG,
                    z: radius,
                  }}
                  transition={springTransition}
                >
                  {!loadedThumbs[index] && <ImageLoader />}
                  <Image
                    src={item}
                    alt={`Món ăn ${index + 1}`}
                    width={56}
                    height={56}
                    sizes={THUMB_SIZES_ATTR}
                    onLoad={() => markThumbLoaded(index)}
                    className={`object-cover ${THUMB_SIZE_CLASSES} transition-opacity duration-300 ${
                      loadedThumbs[index] ? "opacity-90" : "opacity-0"
                    }`}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Center Active Image */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={centerIndex}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: CROSSFADE_DURATION_S,
                ease: CROSSFADE_EASE,
              }}
              className="relative rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(227,24,55,0.22)] border-2 border-white bg-white"
            >
              {!centerLoaded && <ImageLoader />}
              <Image
                src={centerImage}
                alt="Món ăn nổi bật NooNee"
                width={220}
                height={220}
                sizes={CENTER_SIZES_ATTR}
                priority
                onLoad={() => setCenterLoaded(true)}
                className={`object-cover ${CENTER_SIZE_CLASSES} transition-opacity duration-300 ${
                  centerLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 mt-4 z-30">
        <button
          type="button"
          aria-label="Ảnh trước"
          onClick={() => rotateCarousel("left")}
          className={`group relative flex items-center justify-center ${BUTTON_SIZE_CLASSES} rounded-full overflow-hidden
                     shadow-sm border border-[#e2e8f0] bg-white hover:bg-[#fff1f2] hover:border-[#fecdd3]
                     transition-transform duration-200 active:scale-90 cursor-pointer`}
        >
          <ArrowLeft className="relative z-10 h-3.5 w-3.5 text-[#41454d] group-hover:text-[#e31837] transition-colors duration-200" />
        </button>

        <span className="text-[11px] font-medium text-[#9297a0]">
          {centerIndex + 1} / {numImages}
        </span>

        <button
          type="button"
          aria-label="Ảnh tiếp theo"
          onClick={() => rotateCarousel("right")}
          className={`group relative flex items-center justify-center ${BUTTON_SIZE_CLASSES} rounded-full overflow-hidden
                     shadow-sm border border-[#e2e8f0] bg-white hover:bg-[#fff1f2] hover:border-[#fecdd3]
                     transition-transform duration-200 active:scale-90 cursor-pointer`}
        >
          <ArrowRight className="relative z-10 h-3.5 w-3.5 text-[#41454d] group-hover:text-[#e31837] transition-colors duration-200" />
        </button>
      </div>
    </div>
  );
};

export default Carousel360;
