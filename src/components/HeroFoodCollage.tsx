'use client';

import React from 'react';
import Image from 'next/image';

export default function HeroFoodCollage() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Right & Center Food Cluster (Bánh tráng trộn, Gà popcorn, Trà sữa, Trà thái xanh, Phô mai que) */}
      <div className="absolute top-0 right-0 h-full w-auto flex justify-end items-center pointer-events-auto">
        <div className="relative h-full aspect-[1055/1005] max-w-[58vw]">
          <Image
            src="/images/hero_cluster_right.png"
            alt="Món ngon đặc sắc NooNee"
            fill
            priority
            sizes="(max-width: 1800px) 60vw, 1100px"
            className="object-contain object-right pointer-events-none select-none"
          />
        </div>
      </div>

      {/* 2. Bottom-Left Bánh Xèo Giòn Rụm - Natural bottom overflow matching mockup, perfectly below buttons */}
      <div className="absolute bottom-[-10%] xl:bottom-[-12%] 2xl:bottom-[-14%] left-[-1%] xl:left-[0%] h-[32%] xl:h-[35%] 2xl:h-[38%] aspect-[745/355] pointer-events-auto">
        <Image
          src="/images/hero_banhxeo.png"
          alt="Bánh xèo giòn rụm tôm thịt"
          fill
          priority
          sizes="(max-width: 1800px) 35vw, 600px"
          className="object-contain object-left-bottom pointer-events-none select-none"
        />
      </div>
    </div>
  );
}
