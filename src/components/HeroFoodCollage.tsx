'use client';

import React from 'react';
import Image from 'next/image';

export default function HeroFoodCollage() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Bánh tráng trộn sốt me (Top-Right Plate) */}
      <div
        className="absolute top-[1%] right-[-1%] w-[39vw] max-w-[760px] min-w-[380px] z-[2] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-xl"
        title="Bánh tráng trộn sốt me"
      >
        <Image
          src="/foods_nobg/banhtrangtron_hero.png"
          alt="Bánh tráng trộn sốt me"
          width={1004}
          height={789}
          priority
          className="w-full h-auto select-none pointer-events-none"
        />
      </div>

      {/* 2. Trà sữa trân châu đường đen (Far-Right Edge) */}
      <div
        className="absolute top-[32%] right-[0%] w-[14.5vw] max-w-[270px] min-w-[140px] z-[3] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-lg"
        title="Trà sữa trân châu"
      >
        <Image
          src="/foods_nobg/trasua_hero.png"
          alt="Trà sữa trân châu"
          width={442}
          height={735}
          priority
          className="w-full h-auto select-none pointer-events-none"
        />
      </div>

      {/* 3. Bánh xèo giòn rụm tôm thịt (Bottom-Left) */}
      <div
        className="absolute bottom-[-3%] left-[3%] w-[37vw] max-w-[700px] min-w-[360px] z-[2] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-xl"
        title="Bánh xèo giòn rụm"
      >
        <Image
          src="/foods_nobg/banhxeo_hero.png"
          alt="Bánh xèo giòn rụm"
          width={1020}
          height={660}
          priority
          className="w-full h-auto select-none pointer-events-none"
        />
      </div>

      {/* 4. Trà thái xanh mát lạnh (Bottom-Center) */}
      <div
        className="absolute bottom-[-3%] left-[41.5%] w-[14.5vw] max-w-[265px] min-w-[140px] z-[2] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-lg"
        title="Trà thái xanh"
      >
        <Image
          src="/foods_nobg/trathaixanh_hero.png"
          alt="Trà thái xanh"
          width={437}
          height={749}
          priority
          className="w-full h-auto select-none pointer-events-none"
        />
      </div>

      {/* 5. Phô mai que kéo sợi (Bottom-Right) */}
      <div
        className="absolute bottom-[-3%] right-[0%] w-[33vw] max-w-[650px] min-w-[320px] z-[2] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-xl"
        title="Phô mai que kéo sợi"
      >
        <Image
          src="/foods_nobg/phomaique_hero.png"
          alt="Phô mai que"
          width={990}
          height={601}
          priority
          className="w-full h-auto select-none pointer-events-none"
        />
      </div>

      {/* 6. Gà popcorn giòn cay (Center-Right centerpiece) */}
      <div
        className="absolute top-[41%] left-[48.5%] w-[36.5vw] max-w-[700px] min-w-[380px] z-[10] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-2xl"
        title="Gà popcorn giòn cay"
      >
        <Image
          src="/foods_nobg/gapopcorn_hero.png"
          alt="Gà popcorn"
          width={972}
          height={494}
          priority
          className="w-full h-auto select-none pointer-events-none"
        />
      </div>
    </div>
  );
}
