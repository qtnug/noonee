'use client';

import React, { useEffect, useRef } from 'react';

interface HypotrochoidLoaderProps {
  /** Size of the SVG canvas in px */
  size?: number;
  /** Main accent color (stroke + particles) */
  color?: string;
  /** Optional label shown below the animation */
  label?: string;
  /** Wrapper class */
  className?: string;
  /** Full-screen overlay mode */
  fullScreen?: boolean;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

const config = {
  particleCount: 82,
  trailSpan: 0.46,
  durationMs: 2400,
  rotationDurationMs: 42000,
  pulseDurationMs: 6200,
  strokeWidth: 4.6,
  spiroR: 8.2,
  spiror: 2.7,
  spirorBoost: 0.45,
  spirod: 4.8,
  spirodBoost: 1.2,
  spiroScale: 3.05,
};

function point(
  progress: number,
  detailScale: number,
): { x: number; y: number } {
  const t = progress * Math.PI * 2;
  const r = config.spiror + detailScale * config.spirorBoost;
  const d = config.spirod + detailScale * config.spirodBoost;
  const x =
    (config.spiroR - r) * Math.cos(t) +
    d * Math.cos(((config.spiroR - r) / r) * t);
  const y =
    (config.spiroR - r) * Math.sin(t) -
    d * Math.sin(((config.spiroR - r) / r) * t);
  return {
    x: 50 + x * config.spiroScale,
    y: 50 + y * config.spiroScale,
  };
}

function buildPath(detailScale: number, steps = 480): string {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const p = point(index / steps, detailScale);
    return `${index === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }).join(' ');
}

function normalizeProgress(progress: number): number {
  return ((progress % 1) + 1) % 1;
}

function getDetailScale(time: number): number {
  const pulseProgress = (time % config.pulseDurationMs) / config.pulseDurationMs;
  const pulseAngle = pulseProgress * Math.PI * 2;
  return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
}

export default function HypotrochoidLoader({
  size = 120,
  color = '#A30029',
  label,
  className = '',
  fullScreen = false,
}: HypotrochoidLoaderProps) {
  const groupRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const particlesRef = useRef<SVGCircleElement[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const group = groupRef.current;
    const pathEl = pathRef.current;
    if (!group || !pathEl) return;

    // Build particle circles once
    const circles: SVGCircleElement[] = [];
    for (let i = 0; i < config.particleCount; i++) {
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('fill', color);
      group.appendChild(circle);
      circles.push(circle);
    }
    particlesRef.current = circles;

    const startedAt = performance.now();

    function render(now: number) {
      const time = now - startedAt;
      const progress = (time % config.durationMs) / config.durationMs;
      const detailScale = getDetailScale(time);

      pathEl!.setAttribute('d', buildPath(detailScale));

      circles.forEach((node, index) => {
        const tailOffset = index / (config.particleCount - 1);
        const p = point(
          normalizeProgress(progress - tailOffset * config.trailSpan),
          detailScale,
        );
        const fade = Math.pow(1 - tailOffset, 0.56);
        node.setAttribute('cx', p.x.toFixed(2));
        node.setAttribute('cy', p.y.toFixed(2));
        node.setAttribute('r', (0.9 + fade * 2.7).toFixed(2));
        node.setAttribute('opacity', (0.04 + fade * 0.96).toFixed(3));
      });

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      // Remove dynamically created circles on unmount
      circles.forEach((c) => c.parentNode?.removeChild(c));
    };
  }, [color]);

  const loader = (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
        style={{ width: size, height: size, overflow: 'visible' }}
      >
        <g ref={groupRef}>
          <path
            ref={pathRef}
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.12}
          />
        </g>
      </svg>
      {label && (
        <span
          className="text-[13px] font-medium"
          style={{ color: 'rgba(65,69,77,0.85)' }}
        >
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#FFFAF0]">
        {loader}
      </div>
    );
  }

  return loader;
}
