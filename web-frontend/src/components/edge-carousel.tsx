'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

interface EdgeCarouselProps {
  src: string; // image to repeat
  speedPxPerSec?: number; // scroll speed in px/s (lower = slower)
  aspect?: { w: number; h: number }; // optional override for aspect ratio
}

// Edge-to-edge glassmorphic rolling banner.
// - Uses the provided image's native aspect ratio 1024:159 (~6.44)
// - Spans full viewport width (parent should be w-screen)
// - Renders three copies for seamless loop and animates with rAF
export default function EdgeCarousel({ src, speedPxPerSec = 20, aspect }: EdgeCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const [aspectStr, setAspectStr] = useState<string>(() =>
    aspect ? `${aspect.w} / ${aspect.h}` : '1024 / 159'
  );

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
      const move = speedPxPerSec * dt; // px moved in this frame
      offsetRef.current = (offsetRef.current + move) % width;
      track.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [speedPxPerSec]);

  // Detect the image's natural dimensions to set the aspect ratio automatically
  useEffect(() => {
    let active = true;
    const img = new window.Image();
    img.src = src;
    img.decoding = 'async';
    img.onload = () => {
      if (!active) return;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setAspectStr(`${img.naturalWidth} / ${img.naturalHeight}`);
      }
    };
    return () => {
      active = false;
    };
  }, [src]);

  return (
    <div ref={containerRef} className="relative w-screen overflow-hidden" style={{ aspectRatio: aspectStr }}>
      {/* Glassmorphic overlays (no blur to avoid softening the banner) */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-white/5" />
      <div className="pointer-events-none absolute inset-0 z-20 ring-1 ring-white/15" />

      {/* Track with 3 slides for seamless loop */}
      <div ref={trackRef} className="absolute inset-0 flex" style={{ willChange: 'transform' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative shrink-0" style={{ width: '100%', height: '100%' }}>
            <Image src={src} alt={`banner-${i}`} fill priority quality={100} sizes="100vw" className="object-contain" draggable={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
