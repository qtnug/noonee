'use client';

import React from 'react';
import Image from 'next/image';

export default function HeroFoodCollage() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Bánh tráng trộn sốt me (Top-Right Plate) */}
      <div
        className="absolute top-[0.5%] right-[0%] w-[41.6vw] max-w-[750px] min-w-[380px] z-[2] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-xl"
        title="Bánh tráng trộn sốt me"
      >
        <Image
          src="/foods_nobg/banhtrangtron_hero.png"
          alt="Bánh tráng trộn sốt me"
          width={968}
          height={775}
          priority
          className="w-full h-auto select-none pointer-events-none"
        />
      </div>

      {/* 2. Trà sữa trân châu đường đen (Far-Right Edge) */}
      <div
        className="absolute top-[31.5%] right-[1.5%] w-[16.1vw] max-w-[290px] min-w-[140px] z-[4] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-lg"
        title="Trà sữa trân châu"
      >
        <Image
          src="/foods_nobg/trasua_hero.png"
          alt="Trà sữa trân châu"
          width={527}
          height={741}
          priority
          className="w-full h-auto select-none pointer-events-none"
        />
      </div>

      {/* 3. Bánh xèo giòn rụm tôm thịt (Bottom-Left) */}
      <div
        className="absolute bottom-[-2%] left-[3.3%] w-[38.3vw] max-w-[690px] min-w-[350px] z-[2] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-xl"
        title="Bánh xèo giòn rụm"
      >
        <Image
          src="/foods_nobg/banhxeo_hero.png"
          alt="Bánh xèo giòn rụm"
          width={988}
          height={631}
          priority
          className="w-full h-auto select-none pointer-events-none"
        />
      </div>

      {/* 4. Trà thái xanh mát lạnh (Bottom-Center) */}
      <div
        className="absolute bottom-[-2%] left-[41.6%] w-[15.0vw] max-w-[270px] min-w-[140px] z-[2] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-lg"
        title="Trà thái xanh"
      >
        <Image
          src="/foods_nobg/trathaixanh_hero.png"
          alt="Trà thái xanh"
          width={502}
          height={748}
          priority
          className="w-full h-auto select-none pointer-events-none"
        />
      </div>

      {/* 5. Phô mai que kéo sợi (Bottom-Right) */}
      <div
        className="absolute bottom-[-2%] right-[0%] w-[36.1vw] max-w-[650px] min-w-[320px] z-[2] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-xl"
        title="Phô mai que kéo sợi"
      >
        <Image
          src="/foods_nobg/phomaique_hero.png"
          alt="Phô mai que"
          width={970}
          height={660}
          priority
          className="w-full h-auto select-none pointer-events-none"
        />
      </div>

      {/* 6. Gà popcorn giòn cay (Center-Right centerpiece, exact coordinates) */}
      <div
        className="absolute top-[34.7%] left-[52.3%] w-[31.0vw] max-w-[560px] min-w-[320px] z-[10] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-2xl"
        title="Gà popcorn giòn cay"
      >
        <Image
          src="/foods_nobg/gapopcorn_hero.png"
          alt="Gà popcorn"
          width={949}
          height={516}
          priority
          className="w-full h-auto select-none pointer-events-none"
        />
      </div>
    </div>
  );
}
