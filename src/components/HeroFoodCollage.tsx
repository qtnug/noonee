'use client';

import React from 'react';
import Image from 'next/image';

export default function HeroFoodCollage() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Bánh tráng trộn sốt me (Top-Right Plate) */}
      <div
        className="absolute top-[0%] right-[0%] w-[38vw] max-w-[720px] min-w-[320px] z-[2] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-xl"
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
        className="absolute top-[28%] xl:top-[30%] right-[1%] w-[14vw] max-w-[260px] min-w-[120px] z-[4] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-lg"
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

      {/* 3. Bánh xèo giòn rụm tôm thịt (Bottom-Left) - Bottom overflow preserves clearance with buttons */}
      <div
        className="absolute bottom-[-10vw] xl:bottom-[-8vw] 2xl:bottom-[-6vw] left-[2%] w-[34vw] max-w-[620px] min-w-[280px] z-[2] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-xl"
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
        className="absolute bottom-[-4vw] xl:bottom-[-3vw] 2xl:bottom-[-2vw] left-[40%] xl:left-[41%] w-[13vw] max-w-[240px] min-w-[120px] z-[2] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-lg"
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
        className="absolute bottom-[-6vw] xl:bottom-[-5vw] 2xl:bottom-[-4vw] right-[0%] w-[33vw] max-w-[600px] min-w-[280px] z-[2] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-xl"
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

      {/* 6. Gà popcorn giòn cay (Center-Right centerpiece, shifted right to prevent text overlap) */}
      <div
        className="absolute top-[34%] xl:top-[35%] 2xl:top-[34%] left-[53%] xl:left-[52%] 2xl:left-[51%] w-[28vw] xl:w-[29vw] 2xl:w-[30vw] max-w-[540px] min-w-[280px] z-[10] transition-transform duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer drop-shadow-2xl"
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
