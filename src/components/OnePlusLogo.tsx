"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export function KonYeungSignSvg({ className = "w-full h-full" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl flex items-center justify-center ${className}`}>
      <Image
        src="/kon-yeung-icon.png"
        alt="Kun Yeung Emblem"
        fill
        priority
        className="object-contain"
      />
    </div>
  );
}

export const OnePlusSignSvg = KonYeungSignSvg;
export const LensImpactSignSvg = KonYeungSignSvg;

interface KonYeungLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  href?: string;
  className?: string;
}

export function KonYeungLogo({
  size = "md",
  showText = true,
  href = "/",
  className = "",
}: KonYeungLogoProps) {
  // Dimensions map
  const dimensions = {
    sm: { box: "w-7 h-7 sm:w-8 sm:h-8", text: "text-sm sm:text-base", badge: "text-[9px] px-1 py-0.2" },
    md: { box: "w-8 h-8 sm:w-9 sm:h-9", text: "text-base sm:text-lg", badge: "text-[10px] sm:text-xs px-1.5 py-0.5" },
    lg: { box: "w-10 h-10 sm:w-12 sm:h-12", text: "text-lg sm:text-xl", badge: "text-xs px-2 py-0.5" },
    xl: { box: "w-14 h-14 sm:w-16 sm:h-16", text: "text-2xl sm:text-3xl", badge: "text-sm px-2.5 py-1" },
  }[size];

  const content = (
    <div className={`flex items-center space-x-2.5 select-none group ${className}`}>
      {/* 3D Golden Clapperboard Emblem */}
      <div className={`relative ${dimensions.box} flex-shrink-0 drop-shadow-[0_0_16px_rgba(255,184,0,0.4)] group-hover:scale-105 transition-transform duration-300 rounded-xl overflow-hidden bg-black/40 border border-amber-500/20`}>
        <Image
          src="/kon-yeung-icon.png"
          alt="Kun Yeung Logo"
          fill
          priority
          className="object-contain p-0.5"
        />
      </div>

      {/* Typography: Khmer 'កុន យើង' + English 'Kun Yeung' */}
      {showText && (
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-black ${dimensions.text} tracking-tight text-white group-hover:text-white/95 transition-colors font-sans`}>
              កុន យើង
            </span>
            <span className={`font-black ${dimensions.badge} tracking-wider uppercase rounded-md bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-[#FFB800] border border-[#FFB800]/40 shadow-[0_0_10px_rgba(255,184,0,0.15)] whitespace-nowrap`}>
              Kun Yeung
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}

export const LensImpactLogo = KonYeungLogo;
export const OnePlusLogo = KonYeungLogo;

export default KonYeungLogo;
