"use client";

import FastMarquee from "react-fast-marquee";

interface MarqueeProps {
  text: string;
  speed?: number;
  className?: string;
}

export function Marquee({ text, speed = 80, className = "" }: MarqueeProps) {
  return (
    <div className={`overflow-hidden border-y-2 border-border py-4 ${className}`}>
      <FastMarquee speed={speed} gradient={false} autoFill>
        <span className="text-[clamp(2rem,6vw,4rem)] font-bold uppercase tracking-tighter mx-8">
          {text}
        </span>
        <span className="text-accent text-[clamp(2rem,6vw,4rem)] mx-4">★</span>
      </FastMarquee>
    </div>
  );
}

