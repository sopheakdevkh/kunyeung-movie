"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Play,
  Pause,
  Plus,
  Check,
  Star,
  Clock,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  Share2,
  ThumbsUp,
  Download,
  Film,
  Sparkles,
  Info,
  Users,
  Layers,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  Lock,
  FileText,
  Crown,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { MovieData } from "../lib/movies";
import { getBannerBackdropUrl, getPosterCardUrl } from "../lib/cloudinary";
import { parseVideoSource } from "../lib/video";
import PaywallGate from "@/components/pricing/PaywallGate";
import WatchlistButton from "@/components/watchlist/WatchlistButton";
import DiscussionForum from "@/components/comments/DiscussionForum";
import { useAuth } from "@/context/AuthContext";
import { CastMember, CastDataConfig, getCastForMovie } from "@/lib/cast";
import { getCastConfigAction } from "@/app/actions/cast";
import { isMovieAccessibleForRole } from "@/lib/menu-roles";
import { OnePlusSignSvg } from "./OnePlusLogo";

interface MovieDetailsModalProps {
  movie: MovieData | null;
  allMovies?: MovieData[];
  castConfig?: CastDataConfig;
  onSelectMovie?: (movie: MovieData) => void;
  onClose: () => void;
}

type TabType = "overview" | "impact" | "lessons" | "community" | "cast" | "more" | "specs";

export default function MovieDetailsModal({
  movie,
  allMovies = [],
  castConfig,
  onSelectMovie,
  onClose,
}: MovieDetailsModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(1482);
  const [showToast, setShowToast] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Parse video source (YouTube, Vimeo, or direct video file)
  const videoSource = useMemo(() => parseVideoSource(movie?.videoUrl), [movie?.videoUrl]);
  const { user, userState, openAuthModal } = useAuth();
  const isAccessible = isMovieAccessibleForRole(movie?.roleAccess, userState);

  // Reset playback state when movie changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveTab("overview");
  }, [movie?.id]);

  // Record watch history when user watches a movie
  useEffect(() => {
    if (!user?.id || !movie || !isPlaying) return;
    try {
      const key = `lensimpact_watch_history_${user.id}`;
      const stored = JSON.parse(localStorage.getItem(key) || "[]");
      const filtered = stored.filter(
        (item: any) => item.movie?.id !== movie.id && item.id !== movie.id && item.id !== `wh-${movie.id}`
      );
      const newItem = {
        id: `wh-${movie.id}`,
        title: movie.title,
        episode: movie.releaseYear ? `${movie.releaseYear} • Feature Film` : "Feature Film",
        progressPercent: Math.min(
          95,
          Math.max(15, Math.round((currentTime / (duration || 120)) * 100) || 45)
        ),
        posterUrl: movie.bannerUrl || movie.posterUrl,
        movie: movie,
      };
      localStorage.setItem(key, JSON.stringify([newItem, ...filtered].slice(0, 10)));
    } catch {
      // ignore
    }
  }, [user?.id, movie, isPlaying, currentTime, duration]);

  // Handle toast notifications
  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  };

  const handleStartPlayback = () => {
    if (!isAccessible) {
      if (movie?.roleAccess === "vip") {
        triggerToast("VIP Subscription required to stream this title");
      } else {
        openAuthModal({ defaultTab: "signup" });
      }
      return;
    }
    if (!movie?.videoUrl || !videoSource) {
      triggerToast("No trailer URL available for this title yet");
      return;
    }
    setIsPlaying(true);
    if (videoSource.type === "native") {
      setTimeout(() => {
        videoRef.current?.play().catch((err) => {
          console.warn("Autoplay failed or blocked by browser:", err);
        });
      }, 60);
    }
  };

  // Autohide controls during video play
  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds)
    );
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Related movies
  const relatedMovies = useMemo(() => {
    if (!movie) return [];
    return allMovies
      .filter((m) => m.id !== movie.id)
      .slice(0, 4);
  }, [allMovies, movie]);

  // Dynamic Cast & Crew resolution (props or client fallback)
  const [localCastConfig, setLocalCastConfig] = useState<CastDataConfig | null>(castConfig || null);

  useEffect(() => {
    if (castConfig) {
      setLocalCastConfig(castConfig);
      return;
    }
    let isMounted = true;
    getCastConfigAction()
      .then((cfg) => {
        if (isMounted) setLocalCastConfig(cfg);
      })
      .catch((err) => console.warn("Failed to fetch dynamic cast config:", err));

    return () => {
      isMounted = false;
    };
  }, [castConfig]);

  const castList = useMemo(() => {
    if (!movie) return [];
    return getCastForMovie(movie.title, localCastConfig || castConfig);
  }, [movie?.title, localCastConfig, castConfig]);

  if (!movie) return null;

  const hours = Math.floor(movie.duration / 60);
  const mins = movie.duration % 60;
  const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  const backdropUrl = getBannerBackdropUrl(movie.bannerUrl || movie.posterUrl, 1440, 810);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/85 backdrop-blur-2xl sm:p-4 md:p-6 lg:p-8 animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Toast Notification Alert */}
      {showToast && (
        <div className="fixed top-6 z-60 px-5 py-2.5 rounded-full bg-[#1A1C24] border border-[#FF9F0A]/40 text-[#FF9F0A] text-xs sm:text-sm font-bold shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center space-x-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#FF9F0A]" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Main Modal Container: Native-like bottom-sheet on mobile, floating theater on desktop */}
      <div
        className="relative w-full max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-y-auto no-scrollbar rounded-t-[28px] sm:rounded-3xl bg-[#090A0F] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.95),0_0_50px_rgba(0,240,255,0.06)] text-white flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile iOS-style drag pill (floating over video) */}
        <div className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 z-40 w-12 h-1.5 bg-white/40 backdrop-blur-md rounded-full pointer-events-none shadow-sm" />

        {/* Ambient Backlight Glow Effect behind video */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#00F0FF]/10 via-[#FF9F0A]/5 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* Close Button (floating glass circle) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-5 sm:right-5 z-40 p-2 sm:p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white/80 hover:text-white border border-white/15 backdrop-blur-md transition-all shadow-xl active:scale-95 group"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* ========================================================= */}
        {/* CINEMATIC VIDEO PLAYER / HERO BACKDROP                   */}
        {/* ========================================================= */}
        <div
          ref={playerContainerRef}
          onMouseMove={handleUserActivity}
          onTouchStart={handleUserActivity}
          className="relative w-full h-[42dvh] min-h-[300px] max-h-[460px] sm:h-auto sm:min-h-0 sm:max-h-none sm:aspect-[16/9] bg-black flex-shrink-0 overflow-hidden rounded-t-[28px] sm:rounded-t-3xl group select-none"
        >
          {isPlaying && videoSource ? (
            <div className="relative w-full h-full bg-black">
              {videoSource.type === "youtube" ? (
                /* YouTube Embed Player */
                <div className="relative w-full h-full bg-black">
                  <iframe
                    src={videoSource.embedUrl}
                    title={`${movie.title} Trailer`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                  {/* Floating Exit Video / Back to Poster Pill */}
                  {/* <div className="absolute top-4 left-4 z-30">
                    <button
                      onClick={() => setIsPlaying(false)}
                      className="px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-all flex items-center space-x-1.5 text-xs font-semibold shadow-lg group active:scale-95"
                      title="Exit trailer and return to backdrop"
                    >
                      <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-90 transition-transform duration-200 text-[#FF9F0A]" />
                      <span>Back to Poster</span>
                    </button>
                  </div> */}
                </div>
              ) : videoSource.type === "vimeo" ? (
                /* Vimeo Embed Player */
                <div className="relative w-full h-full bg-black">
                  <iframe
                    src={videoSource.embedUrl}
                    title={`${movie.title} Trailer`}
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                  {/* Floating Exit Video / Back to Poster Pill */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30">
                    <button
                      onClick={() => setIsPlaying(false)}
                      className="px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-all flex items-center space-x-1.5 text-xs font-semibold shadow-lg group active:scale-95"
                      title="Exit trailer and return to backdrop"
                    >
                      <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-90 transition-transform duration-200 text-[#FF9F0A]" />
                      <span>Back to Poster</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Native MP4 / Direct Video Stream Player */
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={videoSource.rawUrl}
                    autoPlay
                    playsInline
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        setCurrentTime(videoRef.current.currentTime);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration);
                      }
                    }}
                    onError={() => {
                      triggerToast("Video stream could not be loaded");
                    }}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-full object-cover"
                  />

                  {/* Custom Sleek Glass Overlay Controls */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 flex flex-col justify-between p-4 sm:p-6 transition-opacity duration-300 ${
                      showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  >
                    {/* Player Top HUD */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                          {movie.title}
                        </span>
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-white/80 uppercase border border-white/10">
                          4K Ultra HD • Atmos
                        </span>
                      </div>
                      <button
                        onClick={() => setIsPlaying(false)}
                        className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/15 backdrop-blur-md transition-all flex items-center space-x-1.5 text-[11px] font-medium"
                      >
                        <RotateCcw className="w-3 h-3 text-[#FF9F0A]" />
                        <span>Poster</span>
                      </button>
                    </div>

                    {/* Center Giant Play / Pause Button with Glow */}
                    <div className="flex items-center justify-center space-x-8">
                      <button
                        onClick={() => handleSkip(-10)}
                        className="p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white backdrop-blur-md border border-white/10 active:scale-90 transition-all"
                        title="Skip -10s"
                      >
                        <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>

                      <button
                        onClick={togglePlay}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 shadow-[0_0_35px_rgba(255,255,255,0.4)] transition-all"
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 fill-black text-black" />
                        ) : (
                          <Play className="w-6 h-6 fill-black text-black ml-1" />
                        )}
                      </button>

                      <button
                        onClick={() => handleSkip(10)}
                        className="p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white backdrop-blur-md border border-white/10 active:scale-90 transition-all"
                        title="Skip +10s"
                      >
                        <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>

                    {/* Player Bottom Scrub Bar & Actions */}
                    <div className="space-y-2">
                      {/* Timeline Scrubber */}
                      <div className="flex items-center space-x-3">
                        <span className="text-[11px] font-mono font-medium text-white/80 w-10">
                          {formatTime(currentTime)}
                        </span>

                        <input
                          type="range"
                          min={0}
                          max={duration || 100}
                          step={0.1}
                          value={currentTime}
                          onChange={handleSeek}
                          className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FF9F0A]"
                        />

                        <span className="text-[11px] font-mono font-medium text-white/60 w-10 text-right">
                          {formatTime(duration)}
                        </span>
                      </div>

                      {/* Audio, Quality, and Fullscreen Bar */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={toggleMute}
                            className="text-white hover:text-[#FF9F0A] transition-colors p-1"
                            title={isMuted ? "Unmute" : "Mute"}
                          >
                            {isMuted ? (
                              <VolumeX className="w-5 h-5" />
                            ) : (
                              <Volume2 className="w-5 h-5" />
                            )}
                          </button>

                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="hidden sm:block w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FF9F0A]"
                          />
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/40">
                            HDR 10+
                          </span>
                          <button
                            onClick={toggleFullscreen}
                            className="text-white hover:text-[#FF9F0A] transition-colors p-1"
                            title="Fullscreen"
                          >
                            {isFullscreen ? (
                              <Minimize2 className="w-5 h-5" />
                            ) : (
                              <Maximize2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Poster Backdrop Mode with Cold Eye Ambient Play button */
            <div className="relative w-full h-full">
              <Image
                src={backdropUrl}
                alt={movie.title}
                fill
                sizes="(max-width: 1024px) 100vw, 1200px"
                className="object-cover"
                priority
              />

              {/* Cinematic Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F] via-black/40 to-black/20" />

              {/* Quality & Audio Badges in Top Left */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center space-x-1.5 sm:space-x-2">
                <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white">
                  IMAX ENHANCED
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#00F0FF]/15 backdrop-blur-md border border-[#00F0FF]/30 text-[10px] sm:text-xs font-bold text-[#00F0FF]">
                  DOLBY VISION
                </span>
              </div>

              {/* Center Play Button with Ambilight Glow or Role Access Gate */}
              <div className="absolute inset-0 flex items-center justify-center p-4">
                {!isAccessible ? (
                  <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-black/85 backdrop-blur-2xl border border-white/20 text-center space-y-3.5 shadow-2xl animate-in zoom-in-95">
                    {movie.roleAccess === "vip" ? (
                      <>
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider mx-auto">
                          <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>VIP Member Exclusive</span>
                        </div>
                        <h4 className="text-xl font-black text-white tracking-tight">
                          VIP Subscription Required
                        </h4>
                        <p className="text-xs text-[#8E8E93] leading-relaxed">
                          This video stream is reserved for Kun Yeung VIP Subscribers. Upgrade now to stream all exclusive cinema and directors cuts.
                        </p>
                        <div className="pt-1 flex items-center justify-center gap-3">
                          <Link
                            href="/pricing"
                            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 via-[#FF5500] to-[#EB0029] hover:brightness-110 text-white font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all"
                          >
                            <span>Upgrade to VIP ($4.99/mo)</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-400/20 border border-sky-400/40 text-sky-300 text-xs font-black uppercase tracking-wider mx-auto">
                          <div className="w-3.5 h-3.5 flex-shrink-0">
                            <OnePlusSignSvg />
                          </div>
                          <span>Free Account Required</span>
                        </div>
                        <h4 className="text-xl font-black text-white tracking-tight">
                          Join Free to Stream
                        </h4>
                        <p className="text-xs text-[#8E8E93] leading-relaxed">
                          Create a free Kun Yeung account in 10 seconds to unlock and watch this video.
                        </p>
                        <div className="pt-1 flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => openAuthModal({ defaultTab: "signup" })}
                            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-[#FF5500] hover:bg-[#ff6a1f] text-white font-extrabold text-xs shadow-lg shadow-[#FF5500]/25 transition-all cursor-pointer"
                          >
                            <span>Create Free Account</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleStartPlayback}
                    className="group/btn relative flex items-center space-x-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-white via-white to-[#F2F2F2] text-black font-black shadow-[0_0_40px_rgba(255,255,255,0.35),0_10px_20px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center group-hover/btn:bg-[#FF9F0A] group-hover/btn:text-black transition-colors">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                    <span className="tracking-tight text-sm sm:text-base font-extrabold">
                      Play Trailer
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* MOVIE METADATA & CINEMATIC ACTION BAR                     */}
        {/* ========================================================= */}
        <div className="p-5 sm:p-7 md:p-8 flex-1 flex flex-col">
          {/* Row 1: Title, Match %, Year, Duration, Certification */}
          <div className="space-y-3 pb-6 border-b border-white/10">
            {/* Meta Tags Row */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-black tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                98% MATCH
              </span>

              <span className="px-2 py-0.5 rounded bg-white/10 text-white/90 text-xs font-bold border border-white/10">
                {movie.certification}
              </span>

              <span className="text-xs text-white/40">•</span>
              <span className="text-xs font-semibold text-white/90">{movie.releaseYear}</span>

              <span className="text-xs text-white/40">•</span>
              <span className="text-xs font-semibold text-white/90 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#8E8E93]" />
                {durationText}
              </span>

              <span className="text-xs text-white/40">•</span>
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#FF9F0A]/15 border border-[#FF9F0A]/30">
                <Star className="w-3.5 h-3.5 fill-[#FF9F0A] text-[#FF9F0A]" />
                <span className="text-xs font-black text-[#FF9F0A]">
                  {movie.rating.toFixed(1)} / 10
                </span>
              </div>
            </div>

            {/* Huge Movie Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              {movie.title}
            </h1>

            {/* Action Bar (Modern Streaming Standard) */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              {/* Primary Stream Now Button */}
              <button
                onClick={handleStartPlayback}
                className="flex items-center space-x-2.5 px-6 py-3 rounded-2xl bg-[#FF9F0A] hover:bg-[#FFAB00] text-black font-black text-sm shadow-[0_0_25px_rgba(255,159,10,0.4)] active:scale-95 transition-all duration-200"
              >
                <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                <span>Stream in 4K</span>
              </button>

              {/* Add to Watchlist */}
              <WatchlistButton
                movieId={movie.id}
                movieTitle={movie.title}
                initialSaved={inWatchlist}
              />

              {/* Thumbs Up / Like */}
              <button
                onClick={() => {
                  setIsLiked(!isLiked);
                  setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
                  triggerToast(isLiked ? "Vote removed" : "Added to Liked Movies");
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all duration-200 active:scale-95 flex items-center space-x-1.5 ${
                  isLiked
                    ? "bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                    : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10"
                }`}
                title="Like movie"
              >
                <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-rose-400 text-rose-400" : ""}`} />
                <span className="text-xs">{likeCount}</span>
              </button>

              {/* Download */}
              <button
                onClick={() => triggerToast("Download started: " + movie.title + " (4K UHD)")}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all active:scale-95"
                title="Download for offline"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Share */}
              <button
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    triggerToast("Movie link copied to clipboard!");
                  }
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all active:scale-95"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* INTERACTIVE NAVIGATION TABS                               */}
          {/* ========================================================= */}
          <div className="flex items-center space-x-2 sm:space-x-3 pt-4 pb-2 border-b border-white/10 overflow-x-auto no-scrollbar">
            {[
              { id: "overview", label: "Overview", icon: Info, isGated: false },
              { id: "impact", label: "Impact Analysis", icon: BookOpen, isGated: true },
              { id: "lessons", label: "Lesson Takeaways", icon: Download, isGated: true },
              { id: "community", label: "Discussion Club", icon: MessageSquare, isGated: true },
              { id: "cast", label: "Cast & Crew", icon: Users, isGated: false },
              { id: "more", label: "More Like This", icon: Layers, isGated: false },
              { id: "specs", label: "Audio & Specs", icon: Film, isGated: false },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-white/15 text-white shadow-sm border border-white/20"
                      : "text-[#8E8E93] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.isGated && (
                    <span className="ml-1 text-[9px] px-1.5 py-0.2 rounded-full bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30 font-extrabold flex items-center space-x-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      <span>PRO</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ========================================================= */}
          {/* TAB CONTENTS                                              */}
          {/* ========================================================= */}
          <div className="py-5 flex-1">
            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Tagline */}
                <p className="text-base sm:text-lg font-medium italic text-white/90 border-l-2 border-[#FF9F0A] pl-3">
                  &ldquo;A path of reckoning. Survival has a price.&rdquo;
                </p>

                {/* Synopsis */}
                <p className="text-sm sm:text-base text-[#9A9AA2] leading-relaxed max-w-3xl">
                  {movie.description}
                </p>

                {/* Genres Pills */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-xs font-bold text-white/50 mr-1">Genres:</span>
                  {movie.genres.map((g) => (
                    <span
                      key={g.id}
                      className="px-3.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>

                {/* Star Cast Quick Row */}
                <div className="pt-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/60 mb-3">
                    Key Cast
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {castList.slice(0, 4).map((c) => (
                      <div
                        key={c.name}
                        className="flex items-center space-x-3 p-2.5 rounded-2xl bg-white/5 border border-white/5"
                      >
                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/10">
                          <Image
                            src={c.avatar}
                            alt={c.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{c.name}</p>
                          <p className="text-[10px] text-white/50 truncate">{c.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact Guide Spotlight Teaser Banner on Overview */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FF5500]/10 via-[#161822] to-[#FF5500]/10 border border-[#FF5500]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Full Psychological Impact Guide &amp; Lesson Notes Available
                      </h4>
                      <p className="text-[11px] text-[#8E8E93]">
                        Dive into character psychology, printable study notes, and member discussion.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("impact")}
                    className="px-3.5 py-2 rounded-xl bg-[#FF5500] hover:bg-[#ff6a1a] text-white text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer shadow-[0_0_12px_rgba(255,85,0,0.3)]"
                  >
                    <span>Explore Impact Guide</span>
                    <Sparkles className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* GATED TAB 1: Deep Impact Analysis                         */}
            {/* ========================================================= */}
            {activeTab === "impact" && (
              <PaywallGate moduleName="Deep Impact Analysis">
                <div className="space-y-6 text-xs sm:text-sm text-white/90">
                  {/* Psychological Themes */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center space-x-2 text-[#FF5500] font-black text-xs uppercase tracking-wider">
                      <BookOpen className="w-4 h-4" />
                      <span>Psychological &amp; Thematic Deconstruction</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      The Burden of Inevitability: Psychological Agency in {movie.title}
                    </h3>
                    <p className="text-white/70 leading-relaxed">
                      Beneath the kinetic narrative architecture, {movie.title} constructs a poignant study of moral entrapment. 
                      The protagonist operates within a predetermined code of consequence, embodying the tension between internalized 
                      duty and existential freedom. The narrative asks whether true redemption is possible when identity is forged 
                      through survival mechanisms.
                    </p>
                  </div>

                  {/* Character Dissection Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider text-[#FF9F0A]">
                        Jungian Archetype Breakdown
                      </h4>
                      <p className="text-xs text-white/70 leading-relaxed">
                        The journey reflects the classic encounter with the Shadow. By refusing to surrender their core morality, 
                        the central figure integrates their destructive impulses toward protective self-sacrifice.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider text-[#00F0FF]">
                        Directorial Visual Motifs
                      </h4>
                      <p className="text-xs text-white/70 leading-relaxed">
                        Notice how reflective surfaces (mirrors, rain-slicked pavement, glass) are systematically deployed before 
                        every major ethical threshold, confronting the protagonist with fractured iterations of their purpose.
                      </p>
                    </div>
                  </div>
                </div>
              </PaywallGate>
            )}

            {/* ========================================================= */}
            {/* GATED TAB 2: Printable Lesson Takeaways                   */}
            {/* ========================================================= */}
            {activeTab === "lessons" && (
              <PaywallGate moduleName="Lesson Takeaways &amp; Study Notes">
                <div className="space-y-6 text-xs sm:text-sm text-white/90">
                  {/* Download Action Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-[#181B26] to-[#0E1018] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF5500]">
                        Member Syllabus Resource
                      </span>
                      <h3 className="font-bold text-white text-base">
                        {movie.title} • 14-Page Study &amp; Lesson Syllabus (PDF)
                      </h3>
                      <p className="text-xs text-[#8E8E93]">
                        Includes high-resolution diagrams, moral dilemma flowcharts, and discussion prompts.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerToast("Downloading Printable Study Syllabus...")}
                      className="px-4 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#ff661a] text-white font-bold text-xs transition-colors flex items-center space-x-2 flex-shrink-0 cursor-pointer shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Study Guide</span>
                    </button>
                  </div>

                  {/* Core Life Takeaways List */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider text-white/50">
                      Core Actionable Takeaways:
                    </h4>
                    <div className="space-y-2.5">
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start space-x-3">
                        <span className="w-5 h-5 rounded-full bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          1
                        </span>
                        <div>
                          <strong className="text-white">Agency Over Resignation:</strong>
                          <p className="text-xs text-white/70 mt-0.5">
                            Even within rigid structural systems, deliberate choice remains the fundamental act of humanity.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start space-x-3">
                        <span className="w-5 h-5 rounded-full bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          2
                        </span>
                        <div>
                          <strong className="text-white">The Cost of Isolation:</strong>
                          <p className="text-xs text-white/70 mt-0.5">
                            Hyper-independence is often a trauma response masked as strength; genuine endurance requires reciprocal trust.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start space-x-3">
                        <span className="w-5 h-5 rounded-full bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          3
                        </span>
                        <div>
                          <strong className="text-white">Ethical Integrity at Extremes:</strong>
                          <p className="text-xs text-white/70 mt-0.5">
                            Principles are defined not in comfortable times, but at the exact threshold where upholding them costs comfort.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </PaywallGate>
            )}

            {/* ========================================================= */}
            {/* GATED TAB 3: Community Discussion Club                    */}
            {/* ========================================================= */}
            {activeTab === "community" && (
              <div className="pt-2">
                <DiscussionForum movieTitle={movie.title} />
              </div>
            )}

            {/* Tab 2: Cast & Crew */}
            {activeTab === "cast" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {castList.map((actor) => (
                    <div
                      key={actor.name}
                      className="flex items-center space-x-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-[#FF9F0A]/40 shadow-md">
                        <Image
                          src={actor.avatar}
                          alt={actor.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{actor.name}</p>
                        <p className="text-xs text-[#FF9F0A] truncate">{actor.role}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#0D0E14] border border-white/10 text-xs">
                  <div>
                    <span className="block text-white/50 font-bold mb-1">Director</span>
                    <span className="font-semibold text-white">Chad Stahelski</span>
                  </div>
                  <div>
                    <span className="block text-white/50 font-bold mb-1">Screenplay</span>
                    <span className="font-semibold text-white">Shay Hatten</span>
                  </div>
                  <div>
                    <span className="block text-white/50 font-bold mb-1">Studio</span>
                    <span className="font-semibold text-white">Kun Yeung Originals</span>
                  </div>
                  <div>
                    <span className="block text-white/50 font-bold mb-1">Release</span>
                    <span className="font-semibold text-white">{movie.releaseYear}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: More Like This */}
            {activeTab === "more" && (
              <div className="animate-in fade-in duration-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {relatedMovies.map((item) => {
                    const poster = getPosterCardUrl(item.posterUrl, 400, 250);
                    const isVipLocked = item.roleAccess === "vip" && userState !== "paid_member" && userState !== "admin";
                    const isFreeLocked = item.roleAccess === "free" && userState === "guest";

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectMovie?.(item);
                        }}
                        className={`group cursor-pointer select-none rounded-2xl overflow-hidden bg-white/5 border transition-all duration-300 hover:scale-[1.02] ${
                          isVipLocked
                            ? "border-amber-400/40 hover:border-amber-400"
                            : isFreeLocked
                            ? "border-sky-400/40 hover:border-sky-400"
                            : "border-white/10 hover:border-[#FF9F0A]/40"
                        }`}
                      >
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
                          <Image
                            src={poster}
                            alt={item.title}
                            fill
                            sizes="(max-width: 640px) 50vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                          {/* Role Access Badges */}
                          {item.roleAccess === "vip" ? (
                            <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-[#FF5500] text-black text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-lg backdrop-blur-md">
                              <Crown className="w-3 h-3 fill-black text-black" />
                              <span>VIP</span>
                            </div>
                          ) : item.roleAccess === "free" ? (
                            <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-sky-500/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-lg backdrop-blur-md">
                              <div className="w-3 h-3 flex-shrink-0">
                                <OnePlusSignSvg />
                              </div>
                              <span>FREE</span>
                            </div>
                          ) : item.roleAccess === "admin" ? (
                            <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-rose-500/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-lg backdrop-blur-md">
                              <ShieldAlert className="w-3 h-3" />
                              <span>ADMIN</span>
                            </div>
                          ) : null}

                          {/* Hover Play / Status Action Button */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <div
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full text-white flex items-center justify-center ${
                                isVipLocked
                                  ? "bg-gradient-to-r from-amber-500 to-[#FF5500] shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                                  : isFreeLocked
                                  ? "bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.6)]"
                                  : "bg-[#FF5500] shadow-[0_0_20px_rgba(255,85,0,0.6)]"
                              }`}
                            >
                              {isVipLocked ? (
                                <Crown className="w-4 h-4 fill-black text-black" />
                              ) : isFreeLocked ? (
                                <div className="w-4 h-4 flex-shrink-0">
                                  <OnePlusSignSvg />
                                </div>
                              ) : (
                                <Play className="w-4 h-4 fill-white ml-0.5" />
                              )}
                            </div>
                          </div>

                          <div className="absolute bottom-2 right-2 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white">
                            <Star className="w-3 h-3 fill-[#FF9F0A] text-[#FF9F0A]" />
                            <span>{item.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="p-2.5">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-white/50 mt-0.5">
                            {item.releaseYear} • {item.genres[0]?.name || "Movie"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 4: Audio & Technical Specs */}
            {activeTab === "specs" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#00F0FF]">
                    Audio Formats & Channels
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/80">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>English [Original] (Dolby Atmos 7.1 Surround)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Spanish (Dolby Digital 5.1)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>French (Dolby Digital 5.1)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Japanese (Stereo)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#FF9F0A]">
                    Subtitles & Closed Captions
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed">
                    English [CC], Spanish, French, German, Japanese, Simplified Chinese, Arabic,
                    Portuguese.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
