"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Star, Utensils } from "lucide-react";
import { formatVND } from "@/lib/utils";

export interface CarouselFoodItem {
  id?: number;
  name: string;
  price: number;
  image: string;
  rating?: number;
  categoryName?: string;
  slug?: string;
}

const DEFAULT_FEATURED_DISHES: CarouselFoodItem[] = [
  {
    name: "Cơm Tấm Sườn Bì Chả Đặc Biệt",
    price: 38000,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80",
    categoryName: "Cơm & Món chính",
    rating: 5.0,
  },
  {
    name: "Phở Bò Tái Nạm Hà Nội",
    price: 40000,
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=700&q=80",
    categoryName: "Cơm & Món chính",
    rating: 5.0,
  },
  {
    name: "Cơm Rang Dưa Bò Giòn Rụm",
    price: 40000,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80",
    categoryName: "Cơm & Món chính",
    rating: 5.0,
  },
  {
    name: "Bún Bò Huế Cay Nồng",
    price: 42000,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=80",
    categoryName: "Cơm & Món chính",
    rating: 5.0,
  },
  {
    name: "Cơm Gà Xé Phay Hội An",
    price: 40000,
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=700&q=80",
    categoryName: "Cơm & Món chính",
    rating: 5.0,
  },
  {
    name: "Bánh Tráng Trộn Sốt Me Bò Khô",
    price: 20000,
    image: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=700&q=80",
    categoryName: "Đồ ăn vặt",
    rating: 5.0,
  },
  {
    name: "Nem Chua Rán Giòn Rụm (5 chiếc)",
    price: 25000,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80",
    categoryName: "Đồ ăn vặt",
    rating: 5.0,
  },
  {
    name: "Trà Sữa Trân Châu Tự Chọn Topping",
    price: 25000,
    image: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=700&q=80",
    categoryName: "Đồ uống",
    rating: 5.0,
  },
  {
    name: "Trà Đào Cam Sả Mát Lạnh",
    price: 22000,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80",
    categoryName: "Đồ uống",
    rating: 5.0,
  },
  {
    name: "Cà Phê Sữa Đậm Đà Phin Đắk Lắk",
    price: 18000,
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=700&q=80",
    categoryName: "Đồ uống",
    rating: 5.0,
  },
];

// Carousel Timing & Physics
const AUTOPLAY_INTERVAL_MS = 3200;

const springTransition = {
  type: "spring",
  stiffness: 60,
  damping: 16,
  mass: 0.7,
} as const;

const RADIUS_MIN = 115;
const RADIUS_MAX = 210;
const RADIUS_WIDTH_RATIO = 0.46;
const PERSPECTIVE_MULTIPLIER = 2.3;
const RING_TILT_DEG = 28;

const CROSSFADE_DURATION_S = 0.4;
const CROSSFADE_EASE = [0.22, 1, 0.36, 1] as const;

const THUMB_SIZE_CLASSES = "w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15";
const THUMB_SIZES_ATTR = "(max-width: 640px) 44px, (max-width: 768px) 52px, 60px";

const CENTER_SIZE_CLASSES = "w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52";
const CENTER_SIZES_ATTR = "(max-width: 640px) 160px, (max-width: 768px) 192px, 208px";

const BUTTON_SIZE_CLASSES = "w-8 h-8 sm:w-9 sm:h-9";

const ImageLoader: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-[#f8fafc]">
    <div className="w-1/4 aspect-square rounded-full border-2 border-black/10 border-t-[#e31837] animate-spin" />
  </div>
);

interface Carousel360Props {
  items?: CarouselFoodItem[];
}

export const Carousel360: React.FC<Carousel360Props> = ({
  items = DEFAULT_FEATURED_DISHES,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [radius, setRadius] = useState(155);
  const [isHovered, setIsHovered] = useState(false);
  const [loadedThumbs, setLoadedThumbs] = useState<boolean[]>(() =>
    items.map(() => false)
  );

  const numItems = items.length;
  const angleStep = 360 / numItems;

  const steps = Math.round(rotation / angleStep);
  const centerIndex = ((-steps % numItems) + numItems) % numItems;
  const currentDish = items[centerIndex] || items[0];

  const [prevCenterIndex, setPrevCenterIndex] = useState(centerIndex);
  const [centerLoaded, setCenterLoaded] = useState(false);
  if (centerIndex !== prevCenterIndex) {
    setPrevCenterIndex(centerIndex);
    setCenterLoaded(false);
  }

  // Adjust 3D radius on window resize
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

  // Autoplay rotation (pauses on hover)
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setRotation((prev) => prev + angleStep);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [angleStep, isHovered]);

  const rotateCarousel = useCallback(
    (direction: "left" | "right") => {
      setRotation(
        (prev) => prev + (direction === "left" ? -angleStep : angleStep)
      );
    },
    [angleStep]
  );

  const handleSelectIndex = useCallback(
    (targetIndex: number) => {
      const diff = targetIndex - centerIndex;
      setRotation((prev) => prev - diff * angleStep);
    },
    [centerIndex, angleStep]
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
    <div
      className="bg-white rounded-[14px] border border-[#dddddd] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. DYNAMIC SYNCHRONIZED DISH HEADER (Name + Price + Category) */}
      <div className="border-b border-[#f1f5f9] pb-3 min-h-[58px] flex items-center justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={centerIndex}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="flex-1 pr-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#e31837] bg-[#fff1f2] px-2 py-0.5 rounded-[4px] border border-[#fecdd3]">
                {currentDish.categoryName || "Món ăn nổi bật"}
              </span>
              <span className="text-[11px] text-[#9297a0]">#{centerIndex + 1}</span>
            </div>
            <h3 className="text-[17px] sm:text-[18px] font-bold text-[#181d26] leading-tight line-clamp-1">
              {currentDish.name}
            </h3>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={centerIndex + "-price"}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.25 }}
            className="text-right shrink-0"
          >
            <span className="text-[18px] sm:text-[20px] font-extrabold text-[#e31837]">
              {formatVND(currentDish.price)}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 2. 3D INTERACTIVE ROTATING SHOWCASE */}
      <div className="relative w-full flex flex-col items-center justify-center select-none py-1 sm:py-3">
        <div
          ref={containerRef}
          className="relative w-[96%] max-w-[420px] aspect-[4/3] flex items-center justify-center"
        >
          {/* 3D Ring Orbit */}
          <div
            className="relative w-full h-full"
            style={{ perspective: radius * PERSPECTIVE_MULTIPLIER }}
          >
            {items.map((item, index) => {
              const targetAngle = rotation + angleStep * index;
              const isCurrent = index === centerIndex;

              return (
                <motion.div
                  key={item.name + index}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: targetAngle }}
                  transition={springTransition}
                >
                  <motion.button
                    type="button"
                    onClick={() => handleSelectIndex(index)}
                    aria-label={`Chọn món ${item.name}`}
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                      isCurrent
                        ? "ring-2 ring-[#e31837] shadow-[0_6px_20px_rgba(227,24,55,0.3)] scale-110"
                        : "shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-white/90 hover:scale-105"
                    } bg-white`}
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
                      src={item.image}
                      alt={item.name}
                      width={60}
                      height={60}
                      sizes={THUMB_SIZES_ATTR}
                      onLoad={() => markThumbLoaded(index)}
                      className={`object-cover ${THUMB_SIZE_CLASSES} transition-opacity duration-300 ${
                        loadedThumbs[index] ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </motion.button>
                </motion.div>
              );
            })}
          </div>

          {/* Center Active Dish (Clickable -> Opens /menu) */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={centerIndex}
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -4 }}
                transition={{
                  duration: CROSSFADE_DURATION_S,
                  ease: CROSSFADE_EASE,
                }}
                className="relative rounded-2xl overflow-hidden shadow-[0_12px_32px_rgba(227,24,55,0.22)] border-2 border-white bg-white group cursor-pointer"
              >
                <Link
                  href="/menu"
                  className="block relative overflow-hidden"
                  title="Bấm để xem ngay trong thực đơn"
                >
                  {!centerLoaded && <ImageLoader />}
                  <Image
                    src={currentDish.image}
                    alt={currentDish.name}
                    width={220}
                    height={220}
                    sizes={CENTER_SIZES_ATTR}
                    priority
                    onLoad={() => setCenterLoaded(true)}
                    className={`object-cover ${CENTER_SIZE_CLASSES} transition-all duration-300 group-hover:scale-105 ${
                      centerLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  {/* Gradient Overlay with Dish Name on Card */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 pt-6 text-white flex flex-col justify-end">
                    <p className="text-[12px] font-semibold leading-tight line-clamp-1 text-white group-hover:text-amber-300 transition-colors">
                      {currentDish.name}
                    </p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[13px] font-bold text-amber-300">
                        {formatVND(currentDish.price)}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-white/90 group-hover:underline">
                        <span>Đặt món</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Arrows & Counter */}
        <div className="flex items-center gap-3 mt-3 z-30">
          <button
            type="button"
            aria-label="Món trước"
            onClick={() => rotateCarousel("left")}
            className={`group relative flex items-center justify-center ${BUTTON_SIZE_CLASSES} rounded-full overflow-hidden
                       shadow-xs border border-[#dddddd] bg-white hover:bg-[#fff1f2] hover:border-[#fecdd3]
                       transition-transform duration-200 active:scale-90 cursor-pointer`}
          >
            <ArrowLeft className="relative z-10 h-3.5 w-3.5 text-[#41454d] group-hover:text-[#e31837] transition-colors duration-200" />
          </button>

          <span className="text-[12px] font-medium text-[#717680] tabular-nums">
            {centerIndex + 1} / {numItems}
          </span>

          <button
            type="button"
            aria-label="Món tiếp theo"
            onClick={() => rotateCarousel("right")}
            className={`group relative flex items-center justify-center ${BUTTON_SIZE_CLASSES} rounded-full overflow-hidden
                       shadow-xs border border-[#dddddd] bg-white hover:bg-[#fff1f2] hover:border-[#fecdd3]
                       transition-transform duration-200 active:scale-90 cursor-pointer`}
          >
            <ArrowRight className="relative z-10 h-3.5 w-3.5 text-[#41454d] group-hover:text-[#e31837] transition-colors duration-200" />
          </button>
        </div>
      </div>

      {/* 3. BOTTOM ACTION BAR (Rating + "Xem món ngay" links to /menu) */}
      <div className="flex items-center justify-between pt-3 border-t border-[#f1f5f9]">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
              />
            ))}
          </div>
          <span className="text-[12px] font-semibold text-[#181d26]">
            5.0 <span className="text-[#9297a0] font-normal">(Đánh giá tuyệt đối)</span>
          </span>
        </div>

        <Link
          href="/menu"
          className="h-9 px-4 rounded-[8px] bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a60b20] text-white text-[13px] font-medium inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer group"
        >
          <Utensils className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
          <span>Xem thực đơn</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default Carousel360;
