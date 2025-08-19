'use client';

import React, { useEffect, useRef } from 'react';

interface LiquidGlassBannerProps {
  height?: number; // banner height in px (defaults responsive via classes if not set)
  speedPxPerSec?: number; // scroll speed for the marquee
  text?: string; // main headline text
}

// Liquid glass banner with a subtle animated marquee and decorative blobs
export default function LiquidGlassBanner({
  height,
  speedPxPerSec = 20,
  text = 'Xperience Reality',
}: LiquidGlassBannerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000; // sec
      lastTsRef.current = ts;

      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track) {
        raf = requestAnimationFrame(step);
        return;
      }

      const width = container.clientWidth;
      const move = speedPxPerSec * dt;
      offsetRef.current = (offsetRef.current + move) % width;
      track.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [speedPxPerSec]);

  return (
    <div
      ref={containerRef}
      className={
        'relative w-full overflow-hidden rounded-none md:rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg'
      }
      style={height ? { height } : undefined}
    >
      {/* Decorative blurred blobs */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-16 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl" />


      {/* Subtle top/bottom inner highlights */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10" />

      {/* Animated marquee track (background accents) */}
      <div ref={trackRef} className="absolute inset-0 flex items-center opacity-40 select-none" style={{ willChange: 'transform' }}>
        {Array.from({ length: 24 }).map((_, i) => (
          i % 2 === 0 ? (
            <span
              key={`text-${i}`}
              className="shrink-0 px-10 text-white/70 text-lg md:text-2xl font-medium whitespace-nowrap"
            >
              {text}
            </span>
          ) : (
            <span
              key={`dot-${i}`}
              className="shrink-0 px-10 text-white font-bold text-xl md:text-2xl leading-none"
            >
              •
            </span>
          )
        ))}
      </div>
    </div>
  );
}
