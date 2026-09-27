"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Play,
  Plus,
  Star,
  Image as ImageIcon,
  Video as VideoIcon,
} from "lucide-react";
import { MovieData, FEATURED_SLIDES } from "../lib/movies";
import { parseVideoSource } from "../lib/video";

interface HeroBannerProps {
  slides?: MovieData[];
  onPlayMovie: (movie: MovieData) => void;
  onMoreInfo: (movie: MovieData) => void;
}

export default function HeroBanner({
  slides = FEATURED_SLIDES,
  onPlayMovie,
  onMoreInfo,
}: HeroBannerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const isMuted = true;
  const [isPaused, setIsPaused] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [preferImage, setPreferImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Detect mobile device for 15-second mobile preview
  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  const slideDurationMs = isMobile ? 15000 : 5000;
  const durationSeconds = isMobile ? 15 : 5;

  const videoRef = useRef<HTMLVideoElement>(null);
  const activeSlide = slides[currentSlideIndex] || slides[0];

  // Parse active slide video source (YouTube embed, Vimeo, or direct HTML5 .mp4)
  const videoSource = React.useMemo(() => {
    return parseVideoSource(activeSlide?.videoUrl);
  }, [activeSlide?.videoUrl]);

  // Advance to next slide
  const handleNextSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
    setVideoReady(false);
  }, [slides.length]);


  // Jump to specific slide
  const handleSelectSlide = (index: number) => {
    if (index === currentSlideIndex) return;
    setCurrentSlideIndex(index);
    setProgress(0);
    setVideoReady(false);
  };

  // Reset and prepare video when slide changes
  useEffect(() => {
    // If native video exists, ensure it loads and starts from beginning
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .then(() => setVideoReady(true))
        .catch(() => {
          // Autoplay policy or buffering - fallback image remains visible
        });
    }

    // For YouTube iframes, mark ready after a brief 400ms transition buffer
    if (videoSource?.type === "youtube") {
      const timer = setTimeout(() => setVideoReady(true), 500);
      return () => clearTimeout(timer);
    }
  }, [currentSlideIndex, videoSource?.type]);

  // Dynamic progress timer and auto-slide advance (15s on mobile, 5s on desktop)
  useEffect(() => {
    if (slides.length <= 1 || isPaused || isHovered) return;

    const intervalStepMs = 50;
    const increment = (intervalStepMs / slideDurationMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + increment >= 100) {
          handleNextSlide();
          return 0;
        }
        return prev + increment;
      });
    }, intervalStepMs);

    return () => clearInterval(timer);
  }, [slides.length, isPaused, isHovered, handleNextSlide, slideDurationMs]);

  if (!activeSlide) return null;

  const genresText = activeSlide.genres.map((g) => g.name).join(" | ");

  return (
    <div
      className="relative w-full min-h-[580px] sm:min-h-[660px] lg:min-h-[760px] flex items-center select-none overflow-hidden group/hero"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Container: Poster Fallback + Short Video Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* 1. Instant Backdrop Image (Fallback & Seamless Transition) */}
        {!imageError ? (
          <Image
            key={`poster-${activeSlide.id}`}
            src={activeSlide.bannerUrl || activeSlide.posterUrl}
            alt={activeSlide.title}
            fill
            priority
            unoptimized
            sizes="100vw"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="object-cover object-center brightness-[0.85] transition-transform duration-1000 scale-100"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0F1017] via-[#1A1C28] to-[#0A0B0E]" />
        )}

        {/* 2. Short Video of Movie (Plays 5-second preview) */}
        {videoSource && !isPaused && !preferImage && (
          <div
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 pointer-events-none overflow-hidden ${
              videoReady ? "opacity-100" : "opacity-0"
            }`}
          >
            {videoSource.type === "youtube" ? (
              <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center">
                <iframe
                  key={`yt-${activeSlide.id}-${currentSlideIndex}`}
                  src={`https://www.youtube-nocookie.com/embed/${videoSource.videoId}?autoplay=1&mute=${
                    isMuted ? 1 : 0
                  }&controls=0&loop=1&playlist=${videoSource.videoId}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0`}
                  title={activeSlide.title}
                  className="pointer-events-none object-cover brightness-[0.88] contrast-[1.05] max-w-none
                    /* Mobile portrait: scale to 380vw width so 16:9 height is 214vw (~830px), completely filling container height */
                    w-[380vw] h-[214vw] min-h-[125%] min-w-[220vh]
                    /* Tablet & Desktop */
                    sm:w-[150vw] sm:h-[84.5vw] sm:min-w-full sm:min-h-full
                    md:w-[125vw] md:h-[70.5vw]"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  onLoad={() => setVideoReady(true)}
                />
              </div>
            ) : (
              <video
                key={`vid-${activeSlide.id}-${currentSlideIndex}`}
                ref={videoRef}
                src={videoSource.rawUrl}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                onLoadedData={() => setVideoReady(true)}
                onCanPlay={() => setVideoReady(true)}
                className="w-full h-full min-h-full min-w-full object-cover object-center brightness-[0.88] contrast-[1.05]"
              />
            )}
          </div>
        )}

        {/* 3. Cinematic Vignette Gradients */}
        {/* Left darkening for high text readability on tablet/desktop */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent pointer-events-none sm:block hidden" />
        {/* Mobile vertical gradient: smooth contrast over video while keeping video vivid */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-black/55 to-black/40 pointer-events-none sm:hidden" />
        {/* Bottom smooth fade to content background */}
        <div className="absolute inset-x-0 bottom-0 h-40 sm:h-64 bg-gradient-to-t from-[#0B0B0E] via-[#0B0B0E]/80 to-transparent pointer-events-none" />
        {/* Top subtle fade for header */}
        <div className="absolute inset-x-0 top-0 h-28 sm:h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Hero Content Information Container */}
      <div className="relative z-10 w-full px-4 sm:px-8 md:px-12 lg:px-16 pt-24 sm:pt-36 pb-12 sm:pb-16 flex flex-col justify-center">
        <div className="max-w-2xl space-y-2.5 sm:space-y-4">
          {/* Eyebrow / Kicker */}
          <div className="flex items-center space-x-2">
            <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#FF5500] drop-shadow">
              {activeSlide.tagline || "Featured Original Series"}
            </span>
          </div>

          {/* Huge Cinematic Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] leading-[1.08] font-sans">
            {activeSlide.title}
          </h1>

          {/* Metadata Row: Genres | Star Rating | Release Year */}
          <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-white/80 font-medium pt-0.5">
            <span className="text-white/90">{genresText}</span>
            <span className="text-white/30">•</span>
            <div className="flex items-center space-x-1 text-[#FFB800] font-bold">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#FFB800] text-[#FFB800]" />
              <span>{activeSlide.rating.toFixed(1)}</span>
            </div>
            {activeSlide.releaseYear && (
              <>
                <span className="text-white/30">•</span>
                <span className="px-1.5 py-0.5 rounded text-[11px] bg-white/10 border border-white/15 text-white/80">
                  {activeSlide.releaseYear}
                </span>
              </>
            )}
          </div>

          {/* Synopsis Description (clean clamp on mobile) */}
          <p className="text-xs sm:text-base md:text-lg text-white/75 max-w-xl line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow">
            {activeSlide.description}
          </p>

          {/* Action Buttons Row - Sleek Rounded-Full Pills */}
          <div className="flex items-center space-x-3 sm:space-x-4 pt-2 sm:pt-4">
            {/* Primary Orange Play Now Button */}
            <button
              onClick={() => onPlayMovie(activeSlide)}
              className="flex items-center space-x-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-[#FF5500] hover:bg-[#FF6600] active:scale-95 text-white font-black text-sm sm:text-base shadow-[0_0_30px_rgba(255,85,0,0.45)] transition-all duration-200 group"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
              <span>Play Now</span>
            </button>

            {/* Secondary More Info Button */}
            <button
              onClick={() => onMoreInfo(activeSlide)}
              className="flex items-center space-x-2.5 px-5 sm:px-7 py-3 sm:py-3.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-sm sm:text-base backdrop-blur-md border border-white/20 shadow-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              <span>More Info</span>
            </button>
          </div>
        </div>

        {/* Bottom Interactive Bar: Carousel Indicators & Clean Audio Control */}
        <div className="flex items-center justify-between pt-8 sm:pt-14 w-full max-w-7xl">
          {/* Carousel Slide Indicators with Progress Fill */}
          {slides.length > 1 && (
            <div className="flex items-center space-x-2">
              {slides.map((s, idx) => {
                const isActive = idx === currentSlideIndex;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSlide(idx)}
                    className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 ${
                      isActive
                        ? "w-10 sm:w-14 bg-white/20 shadow-[0_0_10px_rgba(255,85,0,0.3)]"
                        : "w-3 sm:w-5 bg-white/30 hover:bg-white/50"
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  >
                    {isActive && (
                      <div
                        className="h-full bg-[#FF5500] shadow-[0_0_12px_#FF5500] transition-all ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Image Artwork vs Video Preview Toggle */}
          {videoSource && (
            <button
              type="button"
              onClick={() => setPreferImage((prev) => !prev)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 text-white/90 hover:text-white text-[11px] font-bold backdrop-blur-md transition-all active:scale-95 shadow-md ml-auto"
              title={preferImage ? "Switch to Video Trailer Preview" : "Switch to Full Backdrop Image Artwork"}
            >
              {preferImage ? (
                <>
                  <VideoIcon className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Trailer Preview</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>Image Artwork</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
