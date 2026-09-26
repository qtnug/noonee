'use client';

import React from 'react';
import Image from 'next/image';

export default function HeroFoodCollage() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Bánh tráng trộn sốt me (Top-Right - corner cut-off, above & right of chicken) */}
      <div
        className="absolute top-[-14%] xl:top-[-13%] 2xl:top-[-12%] right-[-4%] xl:right-[-3%] 2xl:right-[-2.5%] w-[26vw] max-w-[470px] min-w-[240px] z-[2] pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-105"
        title="Bánh tráng trộn sốt me"
      >
        <Image
          src="/foods_nobg/banhtrangtron_hero.png"
          alt="Bánh tráng trộn sốt me"
          width={968}
          height={775}
          priority
          sizes="(max-width: 1800px) 26vw, 470px"
          className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-xl"
        />
      </div>

      {/* 2. Trà sữa trân châu đường đen (Far-Right - right edge cut-off, below banh trang, clear of chicken) */}
      <div
        className="absolute top-[35%] xl:top-[36%] right-[-2.5%] xl:right-[-2%] w-[9vw] max-w-[160px] min-w-[85px] z-[3] pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-105"
        title="Trà sữa trân châu"
      >
        <Image
          src="/foods_nobg/trasua_hero.png"
          alt="Trà sữa trân châu"
          width={527}
          height={741}
          priority
          sizes="(max-width: 1800px) 9vw, 160px"
          className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-lg"
        />
      </div>

      {/* 3. Đĩa gà popcorn giòn cay (Center - position unchanged as approved by user) */}
      <div
        className="absolute top-[22%] xl:top-[24%] 2xl:top-[25%] left-[41%] xl:left-[42%] 2xl:left-[43%] w-[33vw] max-w-[590px] min-w-[300px] z-[10] pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-105"
        title="Gà popcorn giòn cay"
      >
        <Image
          src="/foods_nobg/gapopcorn_hero.png"
          alt="Gà popcorn giòn cay"
          width={949}
          height={516}
          priority
          sizes="(max-width: 1800px) 33vw, 590px"
          className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-2xl"
        />
      </div>

      {/* 4. Cốc matcha (Trà thái xanh) - bottom cut-off, nestled between banh xeo and chicken */}
      <div
        className="absolute bottom-[-10%] xl:bottom-[-9%] 2xl:bottom-[-8%] left-[32%] xl:left-[33%] 2xl:left-[34%] w-[8.5vw] max-w-[150px] min-w-[80px] z-[5] pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-105"
        title="Trà thái xanh mát lạnh"
      >
        <Image
          src="/foods_nobg/trathaixanh_hero.png"
          alt="Trà thái xanh"
          width={502}
          height={748}
          priority
          sizes="(max-width: 1800px) 9vw, 150px"
          className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-lg"
        />
      </div>

      {/* 5. Đĩa phô mai que kéo sợi - bottom-right cut-off, below chicken and tra sua */}
      <div
        className="absolute bottom-[-17%] xl:bottom-[-15%] 2xl:bottom-[-14%] right-[-4%] xl:right-[-3%] 2xl:right-[-2%] w-[26vw] max-w-[470px] min-w-[240px] z-[4] pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-105"
        title="Phô mai que chiên giòn"
      >
        <Image
          src="/foods_nobg/phomaique_hero.png"
          alt="Phô mai que"
          width={970}
          height={660}
          priority
          sizes="(max-width: 1800px) 26vw, 470px"
          className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-xl"
        />
      </div>

      {/* 6. Bánh xèo giòn rụm (Bottom-Left - bottom-left cut-off, safely below buttons and left of matcha) */}
      <div
        className="absolute bottom-[-6%] xl:bottom-[-5%] left-[-1%] xl:left-[0%] w-[31vw] max-w-[560px] min-w-[300px] z-[2] pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-105"
        title="Bánh xèo giòn rụm"
      >
        <Image
          src="/images/hero_banhxeo.png"
          alt="Bánh xèo giòn rụm"
          width={745}
          height={355}
          priority
          sizes="(max-width: 1800px) 31vw, 560px"
          className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-xl"
        />
      </div>
    </div>
  );
}
