'use client';

import React from 'react';
import Image from 'next/image';

export default function HeroFoodCollage() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Right & Center Food Cluster - Scaled up gracefully to eliminate middle empty space */}
      <div className="absolute top-0 right-[-1%] 2xl:right-0 h-full w-auto flex justify-end items-center pointer-events-auto">
        <div className="relative h-[106%] xl:h-[110%] 2xl:h-[112%] aspect-[1055/1005] max-w-[62vw] transition-transform duration-500 ease-out origin-right">
          <Image
            src="/images/hero_cluster_right.png"
            alt="Món ngon đặc sắc NooNee"
            fill
            priority
            sizes="(max-width: 1800px) 65vw, 1200px"
            className="object-contain object-right pointer-events-none select-none drop-shadow-md"
          />
        </div>
      </div>

      {/* 2. Bottom-Left Bánh Xèo Giòn Rụm - Scaled up generously to eliminate bottom gap while clearing buttons */}
      <div className="absolute bottom-[-3%] xl:bottom-[-4%] 2xl:bottom-[-5%] left-[2%] xl:left-[3.5%] 2xl:left-[4.5%] w-[45vw] max-w-[820px] 2xl:max-w-[860px] min-w-[500px] pointer-events-auto">
        <Image
          src="/images/hero_banhxeo.png"
          alt="Bánh xèo giòn rụm tôm thịt"
          width={745}
          height={355}
          priority
          sizes="(max-width: 1800px) 48vw, 860px"
          className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-md"
        />
      </div>
    </div>
  );
}
