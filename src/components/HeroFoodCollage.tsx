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

      {/* 2. Bottom-Left Bánh Xèo Giòn Rụm - Exact horizontal & vertical anchor matching mockup */}
      <div className="absolute bottom-[-6%] xl:bottom-[-8%] 2xl:bottom-[-10%] left-[3%] xl:left-[5%] 2xl:left-[6.25%] w-[42vw] max-w-[730px] min-w-[460px] pointer-events-auto">
        <Image
          src="/images/hero_banhxeo.png"
          alt="Bánh xèo giòn rụm tôm thịt"
          width={745}
          height={355}
          priority
          sizes="(max-width: 1800px) 42vw, 730px"
          className="w-full h-auto object-contain select-none pointer-events-none"
        />
      </div>
    </div>
  );
}
