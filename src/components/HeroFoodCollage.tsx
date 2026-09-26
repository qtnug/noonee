'use client';

import React from 'react';
import Image from 'next/image';

export default function HeroFoodCollage() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Bánh tráng trộn sốt me (Top-Right) */}
      <div
        className="absolute top-[1%] xl:top-[2%] right-[0%] w-[32vw] max-w-[590px] min-w-[260px] z-[2] pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-105"
        title="Bánh tráng trộn sốt me"
      >
        <Image
          src="/foods_nobg/banhtrangtron_hero.png"
          alt="Bánh tráng trộn sốt me"
          width={968}
          height={775}
          priority
          sizes="(max-width: 1800px) 32vw, 590px"
          className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-xl"
        />
      </div>

      {/* 2. Trà sữa trân châu đường đen (Far-Right) */}
      <div
        className="absolute top-[22%] xl:top-[24%] right-[1%] w-[11vw] max-w-[200px] min-w-[100px] z-[3] pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-105"
        title="Trà sữa trân châu"
      >
        <Image
          src="/foods_nobg/trasua_hero.png"
          alt="Trà sữa trân châu"
          width={527}
          height={741}
          priority
          sizes="(max-width: 1800px) 11vw, 200px"
          className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-lg"
        />
      </div>

      {/* 3. Đĩa gà popcorn giòn cay (Center - shifted left & upward per request) */}
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

      {/* 4. Cốc matcha (Trà thái xanh) - shifted upward per request */}
      <div
        className="absolute bottom-[6%] xl:bottom-[8%] 2xl:bottom-[10%] left-[34%] xl:left-[36%] 2xl:left-[37%] w-[11.5vw] max-w-[200px] min-w-[100px] z-[5] pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-105"
        title="Trà thái xanh mát lạnh"
      >
        <Image
          src="/foods_nobg/trathaixanh_hero.png"
          alt="Trà thái xanh"
          width={502}
          height={748}
          priority
          sizes="(max-width: 1800px) 12vw, 200px"
          className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-lg"
        />
      </div>

      {/* 5. Đĩa phô mai que kéo sợi - shifted upward per request */}
      <div
        className="absolute bottom-[4%] xl:bottom-[6%] 2xl:bottom-[7%] right-[0%] xl:right-[1%] w-[29vw] max-w-[530px] min-w-[260px] z-[4] pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-105"
        title="Phô mai que chiên giòn"
      >
        <Image
          src="/foods_nobg/phomaique_hero.png"
          alt="Phô mai que"
          width={970}
          height={660}
          priority
          sizes="(max-width: 1800px) 29vw, 530px"
          className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-xl"
        />
      </div>

      {/* 6. Bánh xèo giòn rụm (Bottom-Left - scaled smaller per request) */}
      <div
        className="absolute bottom-[-3%] xl:bottom-[-4%] left-[2%] xl:left-[3%] w-[33vw] max-w-[620px] min-w-[320px] z-[2] pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-105"
        title="Bánh xèo giòn rụm"
      >
        <Image
          src="/images/hero_banhxeo.png"
          alt="Bánh xèo giòn rụm"
          width={745}
          height={355}
          priority
          sizes="(max-width: 1800px) 33vw, 620px"
          className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-xl"
        />
      </div>
    </div>
  );
}
