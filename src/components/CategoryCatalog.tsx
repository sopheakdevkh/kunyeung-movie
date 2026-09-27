"use client";

import React, { useRef, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Play,
  Film,
  Sparkles,
  Lock,
  Crown,
  Users,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { MovieData } from "@/lib/movies";
import { CATEGORIES, CATEGORY_ORDER, getCategoryLabel } from "@/lib/categories";
import {
  CategoryAccessLevel,
  CatalogLimits,
  DEFAULT_CATEGORY_RULES,
  DEFAULT_CATALOG_LIMITS,
} from "@/lib/category-rules";
import { useAuth } from "@/context/AuthContext";
import { OnePlusSignSvg } from "./OnePlusLogo";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export interface CategoryBucket {
  slug: string;
  name: string;
  movies: MovieData[];
}

function groupMoviesByCategory(
  movies: MovieData[],
  genresList?: Array<{ slug: string; name: string; order?: number }>
): CategoryBucket[] {
  const bucketsMap = new Map<string, CategoryBucket>();

  // 1. Build dictionary of custom names and order numbering from database genres
  const customNamesMap = new Map<string, string>();
  const orderMap = new Map<string, number>();

  if (genresList) {
    for (let i = 0; i < genresList.length; i++) {
      const g = genresList[i];
      if (g.slug && g.name) {
        customNamesMap.set(g.slug, g.name);
        customNamesMap.set(g.slug.toLowerCase(), g.name);
        const ord = typeof g.order === "number" ? g.order : i + 1;
        orderMap.set(g.slug, ord);
        orderMap.set(g.slug.toLowerCase(), ord);
      }
    }
  }

  // 2. Harvest any custom genre names directly from movies relation
  for (const movie of movies) {
    if (movie.genres) {
      for (const g of movie.genres) {
        if (g.slug && g.name) {
          customNamesMap.set(g.slug, g.name);
        }
      }
    }
  }

  // 3. Pre-seed default categories order so preferred sections show first if they have movies
  for (let idx = 0; idx < CATEGORY_ORDER.length; idx++) {
    const slug = CATEGORY_ORDER[idx];
    if (!orderMap.has(slug)) {
      orderMap.set(slug, 100 + idx);
    }
    bucketsMap.set(slug, {
      slug,
      name: customNamesMap.get(slug) || CATEGORIES[slug] || slug,
      movies: [],
    });
  }

  // 4. Iterate through all movies and assign to their category/genre buckets
  for (const movie of movies) {
    if (!movie.genres || movie.genres.length === 0) continue;

    for (const g of movie.genres) {
      const slug = g.slug;
      if (!slug) continue;

      const categoryName = customNamesMap.get(slug) || g.name || CATEGORIES[slug] || slug;

      if (!bucketsMap.has(slug)) {
        bucketsMap.set(slug, {
          slug,
          name: categoryName,
          movies: [],
        });
      } else {
        // Ensure bucket has the custom name from database
        bucketsMap.get(slug)!.name = categoryName;
      }

      const bucket = bucketsMap.get(slug)!;
      if (!bucket.movies.some((m) => m.id === movie.id)) {
        bucket.movies.push(movie);
      }
    }
  }

  // 5. Filter out categories that have 0 movies and sort strictly by configured order number!
  const activeBuckets = Array.from(bucketsMap.values()).filter((b) => b.movies.length > 0);
  activeBuckets.sort((a, b) => {
    const orderA = orderMap.get(a.slug) ?? orderMap.get(a.slug.toLowerCase()) ?? 999;
    const orderB = orderMap.get(b.slug) ?? orderMap.get(b.slug.toLowerCase()) ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  return activeBuckets;
}

// ─── PosterImage (shared fallback — matches existing sections) ────────────────

function PosterImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1F2B] to-[#0F1015] p-4 text-center">
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
          <Film className="w-5 h-5 text-[#FF5500]" />
        </div>
        <span className="font-bold text-white text-xs line-clamp-2 px-1">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      onError={() => setHasError(true)}
      sizes="(max-width: 640px) 180px, (max-width: 1024px) 210px, 240px"
      className="object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

// ─── Variant A: Standard Poster Shelf (portrait 2/3 cards) ────────────────────
// Matches MovieSectionOne / MovieSectionThree exactly.

function PosterShelf({
  slug,
  name,
  movies,
  userState,
  onSelectMovie,
}: {
  slug: string;
  name?: string;
  movies: MovieData[];
  userState?: string;
  onSelectMovie: (movie: MovieData) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const label = name || getCategoryLabel(slug);

  return (
    <section className="w-full px-4 sm:px-8 md:px-12 lg:px-16 py-5 sm:py-7">
      <div className="flex items-center justify-between mb-3.5 sm:mb-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {label}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors border border-white/10 active:scale-90"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors border border-white/10 active:scale-90"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex space-x-4 sm:space-x-5 overflow-x-auto no-scrollbar scroll-smooth pb-2"
      >
        {movies.map((movie) => {
          const hours = Math.floor(movie.duration / 60);
          const mins = movie.duration % 60;
          const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
          const isVipLocked = movie.roleAccess === "vip" && userState !== "paid_member" && userState !== "admin";
          const isFreeLocked = movie.roleAccess === "free" && userState === "guest";

          return (
            <div
              key={movie.id}
              onClick={() => onSelectMovie(movie)}
              className="group flex-shrink-0 w-44 sm:w-48 md:w-56 cursor-pointer select-none"
            >
              <div
                className={`relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#161822] border shadow-lg transition-all duration-300 ${
                  isVipLocked
                    ? "border-amber-400/40 group-hover:border-amber-400 group-hover:scale-[1.03]"
                    : isFreeLocked
                    ? "border-sky-400/40 group-hover:border-sky-400 group-hover:scale-[1.03]"
                    : "border-white/10 group-hover:border-[#FF5500]/50 group-hover:scale-[1.03]"
                }`}
              >
                <PosterImage src={movie.posterUrl} alt={movie.title} />

                {/* Role Access Badges matching menu views */}
                {movie.roleAccess === "vip" ? (
                  <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-[#FF5500] text-black text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-lg backdrop-blur-md">
                    <Crown className="w-3 h-3 fill-black text-black" />
                    <span>VIP</span>
                  </div>
                ) : movie.roleAccess === "free" ? (
                  <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-sky-500/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-lg backdrop-blur-md">
                    <div className="w-3 h-3 flex-shrink-0">
                      <OnePlusSignSvg />
                    </div>
                    <span>FREE</span>
                  </div>
                ) : movie.roleAccess === "admin" ? (
                  <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-rose-500/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-lg backdrop-blur-md">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Admin</span>
                  </div>
                ) : null}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Hover / Lock Action Button in Center */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div
                    className={`w-11 h-11 rounded-full text-white flex items-center justify-center ${
                      isVipLocked
                        ? "bg-gradient-to-r from-amber-500 to-[#FF5500] shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                        : isFreeLocked
                        ? "bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.6)]"
                        : "bg-[#FF5500] shadow-[0_0_20px_rgba(255,85,0,0.6)]"
                    }`}
                  >
                    {isVipLocked ? (
                      <Crown className="w-5 h-5 fill-black text-black" />
                    ) : isFreeLocked ? (
                      <div className="w-5 h-5 flex-shrink-0">
                        <OnePlusSignSvg />
                      </div>
                    ) : (
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 px-0.5 space-y-0.5">
                <h3 className="font-bold text-white text-sm sm:text-base tracking-tight truncate">
                  {movie.title}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-[#8E8E93] font-medium">
                  <span>{movie.releaseYear}</span>
                  <span className="text-white/30">•</span>
                  <div className="flex items-center space-x-1 text-[#FFB800] font-bold">
                    <Star className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800]" />
                    <span>{movie.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-white/30">•</span>
                  <span>{durationStr}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Variant B: Originals Shelf (landscape 16:9 cards with title overlay) ─────
// Matches StreamPulseOriginalsSectionTwo exactly.

function OriginalsShelf({
  slug,
  name,
  movies,
  userState,
  onSelectMovie,
}: {
  slug: string;
  name?: string;
  movies: MovieData[];
  userState?: string;
  onSelectMovie: (movie: MovieData) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -380 : 380;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const label = name || getCategoryLabel(slug);

  return (
    <section className="w-full px-4 sm:px-8 md:px-12 lg:px-16 py-5 sm:py-7">
      {/* Section Header with LensImpact Exclusive badge */}
      <div className="flex items-center justify-between mb-3.5 sm:mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {label}
          </h2>
          <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[#FFB800] text-[10px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Kun Yeung Exclusive</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors border border-white/10 active:scale-90"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors border border-white/10 active:scale-90"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex space-x-4 sm:space-x-5 overflow-x-auto no-scrollbar scroll-smooth pb-2"
      >
        {movies.map((movie) => {
          const isVipLocked = movie.roleAccess === "vip" && userState !== "paid_member" && userState !== "admin";
          const isFreeLocked = movie.roleAccess === "free" && userState === "guest";

          return (
            <div
              key={movie.id}
              onClick={() => onSelectMovie(movie)}
              className="group flex-shrink-0 w-64 sm:w-72 md:w-80 cursor-pointer select-none"
            >
              {/* 16:9 Stylized Original Card */}
              <div
                className={`relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-[#161822] border shadow-lg transition-all duration-300 ${
                  isVipLocked
                    ? "border-amber-400/40 group-hover:border-amber-400 group-hover:scale-[1.02]"
                    : isFreeLocked
                    ? "border-sky-400/40 group-hover:border-sky-400 group-hover:scale-[1.02]"
                    : "border-white/10 group-hover:border-[#FF5500]/50 group-hover:scale-[1.02]"
                }`}
              >
                <Image
                  src={movie.bannerUrl || movie.posterUrl}
                  alt={movie.title}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 260px, (max-width: 1024px) 300px, 340px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Dark atmospheric overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />

                {/* LensImpact Logo Badge */}
                <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5 px-2 py-1">
                  <div className="w-6 h-6">
                    <OnePlusSignSvg />
                  </div>
                </div>

                {/* Role Access Badges */}
                {movie.roleAccess === "vip" ? (
                  <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-[#FF5500] text-black text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-lg backdrop-blur-md">
                    <Crown className="w-3 h-3 fill-black text-black" />
                    <span>VIP</span>
                  </div>
                ) : movie.roleAccess === "free" ? (
                  <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-sky-500/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-lg backdrop-blur-md">
                    <div className="w-3 h-3 flex-shrink-0">
                      <OnePlusSignSvg />
                    </div>
                    <span>FREE</span>
                  </div>
                ) : movie.roleAccess === "admin" ? (
                  <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-rose-500/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-lg backdrop-blur-md">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Admin</span>
                  </div>
                ) : null}

                {/* Hover Play / Lock Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30 backdrop-blur-[2px]">
                  <div
                    className={`w-11 h-11 rounded-full text-white flex items-center justify-center ${
                      isVipLocked
                        ? "bg-gradient-to-r from-amber-500 to-[#FF5500] shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                        : isFreeLocked
                        ? "bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.6)]"
                        : "bg-[#FF5500] shadow-[0_0_20px_rgba(255,85,0,0.6)]"
                    }`}
                  >
                    {isVipLocked ? (
                      <Crown className="w-5 h-5 fill-black text-black" />
                    ) : isFreeLocked ? (
                      <div className="w-5 h-5 flex-shrink-0">
                        <OnePlusSignSvg />
                      </div>
                    ) : (
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="mt-2.5 px-0.5 space-y-0.5">
                <h3 className="font-bold text-white text-sm sm:text-base tracking-tight truncate">
                  {movie.title}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-[#8E8E93] font-medium">
                  <span>{movie.releaseYear}</span>
                  <span className="text-white/30">•</span>
                  <div className="flex items-center space-x-1 text-[#FFB800] font-bold">
                    <Star className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800]" />
                    <span>{movie.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-white/30">•</span>
                  <span>{movie.duration}m</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── LockedCategoryShelf (Rendered when category is gated) ───────────────────

function LockedCategoryShelf({
  name,
  movies,
  reason,
  onAction,
}: {
  name: string;
  movies: MovieData[];
  reason: "free_required" | "vip_required" | "guest_limit";
  onAction: () => void;
}) {
  const isVip = reason === "vip_required";
  const isLimit = reason === "guest_limit";

  return (
    <section className="relative w-full py-8 sm:py-10 border-t border-white/5 overflow-hidden">
      {/* Blurred background preview of the shelf */}
      <div className="px-4 sm:px-8 md:px-12 lg:px-16 opacity-20 blur-sm pointer-events-none select-none">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-black text-white">{name}</h2>
          <span className="text-xs text-white/40">{movies.length} titles</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
          {movies.slice(0, 7).map((m) => (
            <div
              key={m.id}
              className="aspect-[2/3] rounded-2xl bg-white/10 overflow-hidden relative"
            >
              {m.posterUrl && (
                <Image
                  src={m.posterUrl}
                  alt={m.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dark gradient & vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-[#0B0B0E]/80 to-[#0B0B0E]/50 pointer-events-none" />

      {/* Centered Glassmorphism Access Gate Card */}
      <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
        <div
          className={`max-w-xl w-full p-6 sm:p-8 rounded-3xl text-center space-y-4 shadow-2xl backdrop-blur-xl border ${
            isVip
              ? "bg-gradient-to-b from-[#181B26]/95 to-[#0F1118]/95 border-amber-400/35 shadow-[0_0_40px_rgba(245,158,11,0.12)]"
              : "bg-[#0F1118]/95 border-white/15 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
          }`}
        >
          {/* Badge */}
          <div
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider mx-auto ${
              isVip
                ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                : "bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30"
            }`}
          >
            {isVip ? (
              <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>
              {isVip
                ? "VIP Member Exclusive Collection"
                : isLimit
                ? "Guest Browsing Limit Reached"
                : "Free Account Required"}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            {isVip
              ? `Unlock the "${name}" Collection`
              : isLimit
              ? `Unlock 10+ More Curated Shelves`
              : `Join to Explore "${name}"`}
          </h3>

          <p className="text-xs sm:text-sm text-[#8E8E93] leading-relaxed max-w-md mx-auto">
            {isVip
              ? `Exclusive cinematic analyses, character psychology deconstructions, and discussion salons in "${name}".`
              : isLimit
              ? `You have reached the guest catalog preview limit. Create a free account or upgrade to VIP to explore the complete library.`
              : `Create a free account to unlock this entire category shelf and save films to your personal watchlist.`}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isVip ? (
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 via-[#FF5500] to-[#EB0029] hover:from-amber-400 hover:to-[#ff1a40] text-white font-extrabold text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all flex items-center justify-center space-x-2"
              >
                <span>Upgrade to VIP ($4.99/mo)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#FF5500] hover:bg-[#ff6a1f] text-white font-extrabold text-xs sm:text-sm shadow-[0_0_20px_rgba(255,85,0,0.35)] transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <Link
              href="/pricing"
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              View All VIP Plans &amp; Perks
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CategoryCatalog (main export) ────────────────────────────────────────────

interface CategoryCatalogProps {
  movies: MovieData[];
  genres?: Array<{ slug: string; name: string }>;
  categoryRules?: Record<string, CategoryAccessLevel>;
  catalogLimits?: CatalogLimits;
  onSelectMovie: (movie: MovieData) => void;
}

/**
 * Groups movies by category and renders shelves with role-based access gating:
 *   - Guests: Can browse public shelves up to guestCategoryLimit; free/vip shelves are locked.
 *   - Free Users: Can browse all public + free shelves; VIP shelves show premium paywall.
 *   - Paid Members & Admins: 100% unlocked access to every category shelf.
 */
export default function CategoryCatalog({
  movies,
  genres,
  categoryRules = DEFAULT_CATEGORY_RULES,
  catalogLimits = DEFAULT_CATALOG_LIMITS,
  onSelectMovie,
}: CategoryCatalogProps) {
  const { userState } = useAuth();
  const buckets = useMemo(() => groupMoviesByCategory(movies, genres), [movies, genres]);

  const isGuest = userState === "guest";
  const isFullAccess = userState === "paid_member" || userState === "admin";

  // Filter buckets: completely hide restricted categories for a clean, premium UI.
  // Users only see categories they have access to; Admins see all categories.
  const visibleBuckets = useMemo(() => {
    if (buckets.length === 0) return [];
    let publicCount = 0;
    return buckets.filter((bucket) => {
      // 1. Admin and VIP Paid Members: Full Access to all categories
      if (isFullAccess) return true;

      const rule: CategoryAccessLevel = categoryRules[bucket.slug] || "public";

      // 2. VIP Category: Completely hidden from Guest and Free Users
      if (rule === "vip") return false;

      // 3. Free Account Required Category: Completely hidden from Guests
      if (rule === "free" && isGuest) return false;

      // 4. Guest Shelf Count Limit: Hide any shelves exceeding guest limit
      if (isGuest) {
        publicCount += 1;
        if (publicCount > (catalogLimits?.guestCategoryLimit || 3)) {
          return false;
        }
      }

      return true;
    });
  }, [buckets, isFullAccess, isGuest, categoryRules, catalogLimits]);

  if (visibleBuckets.length === 0) return null;

  return (
    <>
      {visibleBuckets.map((bucket, index) => {
        return index % 2 === 0 ? (
          <PosterShelf
            key={bucket.slug}
            slug={bucket.slug}
            name={bucket.name}
            movies={bucket.movies}
            userState={userState}
            onSelectMovie={onSelectMovie}
          />
        ) : (
          <OriginalsShelf
            key={bucket.slug}
            slug={bucket.slug}
            name={bucket.name}
            movies={bucket.movies}
            userState={userState}
            onSelectMovie={onSelectMovie}
          />
        );
      })}
    </>
  );
}
