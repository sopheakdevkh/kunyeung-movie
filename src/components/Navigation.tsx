"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  ChevronDown,
  X,
  Menu,
  Sparkles,
  Shield,
  Crown,
  Bookmark,
  Settings,
  CreditCard,
  LogOut,
  Film,
  User,
  Compass,
  ArrowRight,
} from "lucide-react";
import { LensImpactLogo } from "./OnePlusLogo";
import { useAuth } from "@/context/AuthContext";

export type NavTab = "Browse" | "TV Shows" | "Movies" | "New & Popular" | "My List";

export interface NavigationProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
  className?: string;
}

const NAV_TABS: NavTab[] = ["Browse", "TV Shows", "Movies", "New & Popular", "My List"];

// Helper to compute user initials
function getUserInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.trim().length > 0) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

// Resolves avatar image: custom uploaded avatar, or generated branded profile avatar
function getProfileImageUrl(avatar?: string | null, name?: string | null, email?: string | null): string {
  if (avatar && avatar.trim().length > 0) {
    return avatar.trim();
  }
  const seed = name?.trim() || email?.split("@")[0] || "User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=FF5500&color=ffffff&bold=true&font-size=0.45&rounded=true&size=160`;
}

export default function Navigation({
  activeTab = "Browse",
  onTabChange,
  searchQuery = "",
  onSearchChange,
  showSearch = true,
  className = "",
}: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    user,
    isAuthenticated,
    userState,
    isMember,
    isAdmin,
    logout,
    openAuthModal,
    checkAuth,
  } = useAuth();

  // Component UI State
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Determine tiers cleanly
  const isAdminUser = Boolean(isAdmin || user?.role === "admin" || userState === "admin");
  const isPaidMember = Boolean(
    !isAdminUser &&
      (isMember ||
        user?.subscription_status === "active" ||
        user?.subscriptionStatus === "active" ||
        userState === "paid_member")
  );
  const isFreeUser = Boolean(
    !isAdminUser &&
      !isPaidMember &&
      (isAuthenticated || userState === "free_user" || (user && user.id))
  );
  const isGuest = !isAdminUser && !isPaidMember && !isFreeUser;

  // Track window scroll for backdrop elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Dynamic tabs: Hide "My List" for normal visit users (guests)
  const visibleTabs: NavTab[] = isGuest
    ? ["Browse", "TV Shows", "Movies", "New & Popular"]
    : ["Browse", "TV Shows", "Movies", "New & Popular", "My List"];

  // If a guest lands on or has "My List" active, automatically redirect to "Browse"
  useEffect(() => {
    if (isGuest && activeTab === "My List" && onTabChange) {
      onTabChange("Browse");
    }
  }, [isGuest, activeTab, onTabChange]);

  // Handle Tab navigation
  const handleTabClick = (tab: NavTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (pathname !== "/") {
      router.push(`/?tab=${encodeURIComponent(tab)}`);
    }
    setIsMobileMenuOpen(false);
  };

  const displayName = user?.name || (user?.email ? user.email.split("@")[0] : "Film Clubber");
  const displayEmail = user?.email || "";
  const initials = getUserInitials(user?.name, user?.email);

  // Proactively fetch updated user profile and avatar
  useEffect(() => {
    if (isAuthenticated) {
      checkAuth();
    }
  }, [isAuthenticated, checkAuth]);

  // Resolves custom uploaded avatar, or generated branded profile avatar
  const avatarSrc = useMemo(() => {
    if (!isAuthenticated && !user) return "";
    return getProfileImageUrl(user?.avatar, user?.name, user?.email);
  }, [isAuthenticated, user?.avatar, user?.name, user?.email]);

  const [topAvatarError, setTopAvatarError] = useState(false);
  const [dropAvatarError, setDropAvatarError] = useState(false);
  const [mobileAvatarError, setMobileAvatarError] = useState(false);

  useEffect(() => {
    setTopAvatarError(false);
    setDropAvatarError(false);
    setMobileAvatarError(false);
  }, [avatarSrc]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 select-none ${
        isScrolled
          ? "bg-[#090A0E]/95 backdrop-blur-2xl border-b border-white/10 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.8)]"
          : "bg-gradient-to-b from-[#090A0E]/90 via-[#090A0E]/60 to-transparent py-4 sm:py-5"
      } ${className}`}
    >
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 flex items-center justify-between">
        {/* ========================================================= */}
        {/* Left: Brand Logo & Desktop Navigation Tabs                */}
        {/* ========================================================= */}
        <div className="flex items-center space-x-6 sm:space-x-10">
          <LensImpactLogo size="md" href="/" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5" aria-label="Main Navigation">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-semibold transition-all duration-200 focus:outline-none relative ${
                    isActive
                      ? "text-white font-bold bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-white/20"
                      : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <span>{tab}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gradient-to-r from-[#FF5500] to-[#EB0029] rounded-full shadow-[0_0_8px_#EB0029]" />
                  )}
                </button>
              );
            })}

            {/* Dedicated VIP Club direct link for visitors and members */}
            <Link
              href="/pricing"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-amber-300 hover:text-amber-200 bg-gradient-to-r from-amber-500/15 to-red-500/15 hover:from-amber-500/25 hover:to-red-500/25 border border-amber-400/30 transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)] ml-1 hover:scale-105 active:scale-95"
            >
              <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>VIP Plan</span>
            </Link>
          </nav>
        </div>

        {/* ========================================================= */}
        {/* Right: Search, Notifications & Auth State Controls         */}
        {/* ========================================================= */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          {/* Search Toggle / Input */}
          {showSearch && (
            <div className="relative flex items-center">
              {showSearchInput ? (
                <div className="flex items-center bg-black/80 border border-white/20 rounded-full px-3 py-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                  <Search className="w-4 h-4 text-white/60 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                    placeholder="Titles, directors, topics..."
                    autoFocus
                    className="bg-transparent text-xs sm:text-sm text-white focus:outline-none w-32 sm:w-52 placeholder-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowSearchInput(false);
                      if (onSearchChange) onSearchChange("");
                    }}
                    className="text-white/50 hover:text-white ml-1.5 p-0.5"
                    aria-label="Clear Search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSearchInput(true)}
                  className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/5 transition-colors"
                  aria-label="Open Search"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* 1. GUEST STATE: VIP Plans Link + Sign In + Join Club CTA */}
          {/* ======================================================= */}
          {isGuest && (
            <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/pricing"
                className="hidden xl:inline-flex items-center space-x-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors px-3 py-1.5 rounded-full hover:bg-amber-400/10 border border-transparent hover:border-amber-400/20"
              >
                <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Plans &amp; Perks</span>
              </Link>

              <button
                type="button"
                onClick={() => openAuthModal({ defaultTab: "signin" })}
                className="text-xs sm:text-sm font-semibold text-white/80 hover:text-white transition-colors px-3.5 py-1.5 rounded-full hover:bg-white/10 border border-white/10 hover:border-white/20"
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => openAuthModal({ defaultTab: "signup" })}
                className="inline-flex items-center space-x-1.5 font-bold text-xs sm:text-sm px-4 py-2 rounded-full bg-gradient-to-r from-[#FF5500] to-[#EB0029] hover:from-[#ff6b1a] hover:to-[#ff1a40] text-white shadow-[0_0_20px_rgba(235,0,41,0.45)] hover:shadow-[0_0_28px_rgba(235,0,41,0.7)] transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Join Club</span>
              </button>
            </div>
          )}

          {/* ======================================================= */}
          {/* 2. FREE USER: "Upgrade to VIP" Button + Avatar Menu    */}
          {/* ======================================================= */}
          {isFreeUser && (
            <Link
              href="/pricing"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-[#FF5500] to-[#EB0029] hover:from-amber-400 hover:to-[#ff1a40] text-white text-xs font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_28px_rgba(245,158,11,0.6)] transition-all hover:scale-105 group border border-amber-300/30"
            >
              <Crown className="w-3.5 h-3.5 fill-white" />
              <span>Upgrade to VIP</span>
            </Link>
          )}

          {/* ======================================================= */}
          {/* 3. PAID MEMBER: Gold VIP Member Indicator               */}
          {/* ======================================================= */}
          {isPaidMember && (
            <Link
              href="/pricing"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-red-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider shadow-[0_0_16px_rgba(245,158,11,0.3)] hover:scale-105 transition-all"
              title="Active VIP Club Membership • Manage Plan"
            >
              <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
              <span>VIP Member</span>
            </Link>
          )}

          {/* ======================================================= */}
          {/* 4. ADMIN: Unmistakable "Admin CMS" Quick-Link Button    */}
          {/* ======================================================= */}
          {isAdminUser && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#EB0029] to-[#FF5500] hover:from-[#ff1a40] hover:to-[#ff6a1a] text-white text-xs font-black shadow-[0_0_18px_rgba(235,0,41,0.6)] border border-red-400/40 hover:scale-105 transition-all"
            >
              <Shield className="w-3.5 h-3.5 fill-white" />
              <span>Admin CMS</span>
            </Link>
          )}

          {/* ======================================================= */}
          {/* Authenticated User Avatar Pill with State-aware Dropdown */}
          {/* ======================================================= */}
          {!isGuest && (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-white/10 transition-colors group focus:outline-none"
                aria-expanded={isProfileOpen}
                aria-label="User Account Menu"
              >
                {/* Avatar with State-specific ring/badge */}
                <div
                  className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                    isAdminUser
                      ? "ring-2 ring-[#EB0029] shadow-[0_0_12px_rgba(235,0,41,0.5)] bg-[#1A1114]"
                      : isPaidMember
                      ? "ring-2 ring-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.5)] bg-gradient-to-br from-[#261E0E] to-[#120F08]"
                      : "ring-1 ring-white/20 group-hover:ring-[#FF5500]/50 bg-[#161822]"
                  }`}
                >
                  {!topAvatarError && avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={displayName}
                      className="w-full h-full object-cover rounded-full"
                      onError={() => setTopAvatarError(true)}
                    />
                  ) : (
                    <span
                      className={`font-black text-xs sm:text-sm ${
                        isAdminUser
                          ? "text-[#EB0029]"
                          : isPaidMember
                          ? "text-amber-300"
                          : "text-white"
                      }`}
                    >
                      {initials}
                    </span>
                  )}

                  {/* Overlapping Gold/Red Member Crown Icon for Paid Members */}
                  {isPaidMember && (
                    <div
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-[#EB0029] to-[#FFD700] text-black flex items-center justify-center shadow-md border border-[#090A0E]"
                      title="Club Member"
                    >
                      <Crown className="w-2.5 h-2.5 fill-black text-black" />
                    </div>
                  )}

                  {/* Overlapping Shield Icon for Admin */}
                  {isAdminUser && (
                    <div
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#EB0029] text-white flex items-center justify-center shadow-md border border-[#090A0E]"
                      title="Administrator"
                    >
                      <Shield className="w-2.5 h-2.5 fill-white text-white" />
                    </div>
                  )}
                </div>

                {/* Username label (Desktop) */}
                <span className="hidden md:inline-block text-xs sm:text-sm font-bold text-white/90 group-hover:text-white max-w-[110px] truncate">
                  {displayName}
                </span>

                {isPaidMember && (
                  <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    VIP
                  </span>
                )}

                <ChevronDown
                  className={`w-3.5 h-3.5 text-white/70 group-hover:text-white transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180 text-white" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu Modal */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#14161F] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-2xl">
                  {/* User Profile Header Card */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 mb-1.5">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0 ${
                          isAdminUser
                            ? "bg-[#EB0029]/20 text-[#EB0029] border border-[#EB0029]/40"
                            : isPaidMember
                            ? "bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40"
                            : "bg-white/10 text-white border border-white/15"
                        }`}
                      >
                        {!dropAvatarError && avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={displayName}
                            className="w-full h-full object-cover rounded-full"
                            onError={() => setDropAvatarError(true)}
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{displayName}</p>
                        <p className="text-[#8E8E93] text-[11px] truncate">{displayEmail}</p>
                      </div>
                    </div>

                    {/* Badge Pill */}
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                        Plan Tier
                      </span>
                      {isAdminUser ? (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EB0029]/20 text-[#EB0029] border border-[#EB0029]/40 flex items-center space-x-1">
                          <Shield className="w-2.5 h-2.5" />
                          <span>Admin</span>
                        </span>
                      ) : isPaidMember ? (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FFD700]/20 to-[#EB0029]/20 text-[#FFD700] border border-[#FFD700]/40 flex items-center space-x-1">
                          <Crown className="w-2.5 h-2.5 fill-[#FFD700]" />
                          <span>Club Member</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/15">
                          Free User
                        </span>
                      )}
                    </div>
                  </div>

                  {/* =================================================== */}
                  {/* State-specific Navigation Options                   */}
                  {/* =================================================== */}

                  {/* FREE USER: [Upgrade VIP banner, My Watchlist, Account Settings, Sign Out] */}
                  {isFreeUser && (
                    <div className="space-y-1 py-1">
                      {/* Go Premium CTA inside dropdown */}
                      <Link
                        href="/pricing"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-[#FF5500]/20 to-[#EB0029]/20 hover:from-amber-500/30 hover:to-[#EB0029]/30 text-amber-300 border border-amber-400/30 transition-all font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      >
                        <Crown className="w-4 h-4 fill-amber-400 text-amber-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white">Upgrade to VIP Member</p>
                          <p className="text-[10px] text-amber-300/80 font-normal">Unlock 4K UHD &amp; Study Guides</p>
                        </div>
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-[#8E8E93]" />
                        <span>My Watchlist</span>
                      </Link>

                      <Link
                        href="/dashboard#settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[#8E8E93]" />
                        <span>Account Settings</span>
                      </Link>
                    </div>
                  )}

                  {/* PAID MEMBER: [VIP Active Pill, My Watchlist, Member Lounge, Billing & Plan, Sign Out] */}
                  {isPaidMember && (
                    <div className="space-y-1 py-1">
                      <div className="px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 flex items-center space-x-2">
                        <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-[11px] font-bold">Active VIP Plan Membership</span>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-amber-400" />
                        <span>My Watchlist</span>
                      </Link>

                      <Link
                        href="/movies"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-[#FFD700]/10 text-white/90 hover:text-[#FFD700] transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="font-semibold">Member Lounge</span>
                      </Link>

                      <Link
                        href="/pricing"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-[#8E8E93]" />
                        <span>Manage Subscription</span>
                      </Link>

                      <Link
                        href="/dashboard#settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[#8E8E93]" />
                        <span>Account Settings</span>
                      </Link>
                    </div>
                  )}

                  {/* ADMIN: [Admin CMS, Subscriptions, Film CMS, Sign Out] */}
                  {isAdminUser && (
                    <div className="space-y-0.5 py-1">
                      <Link
                        href="/admin"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-[#EB0029]/15 hover:bg-[#EB0029]/25 text-[#EB0029] border border-[#EB0029]/30 font-bold transition-colors"
                      >
                        <Shield className="w-4 h-4 text-[#EB0029]" />
                        <span>Admin Console</span>
                      </Link>

                      <Link
                        href="/admin/content"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                      >
                        <Film className="w-4 h-4 text-[#8E8E93]" />
                        <span>Film Content CMS</span>
                      </Link>

                      <Link
                        href="/admin/subscriptions"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-[#8E8E93]" />
                        <span>Subscriptions Manager</span>
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-[#8E8E93]" />
                        <span>My Watchlist</span>
                      </Link>

                      <Link
                        href="/dashboard#settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[#8E8E93]" />
                        <span>Account Settings</span>
                      </Link>
                    </div>
                  )}

                  {/* Sign Out Button */}
                  <div className="border-t border-white/10 mt-2 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsProfileOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-left text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-semibold"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* Mobile Hamburger Menu Toggle Button                     */}
          {/* ======================================================= */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Toggle Navigation Menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* =========================================================== */}
      {/* Mobile Horizontal Sub-menu for tabs (Quick Scroll)          */}
      {/* =========================================================== */}
      {!isMobileMenuOpen && (
        <div className="md:hidden flex items-center space-x-2 px-4 pt-3 overflow-x-auto no-scrollbar text-xs">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabClick(tab)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                  isActive
                    ? "bg-[#EB0029] text-white font-bold shadow-[0_0_10px_rgba(235,0,41,0.5)]"
                    : "bg-white/5 text-white/70 hover:text-white"
                }`}
              >
                {tab}
              </button>
            );
          })}

          <Link
            href="/pricing"
            className="flex items-center space-x-1 px-3 py-1 rounded-full whitespace-nowrap text-amber-300 font-bold bg-amber-400/15 border border-amber-400/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
          >
            <Crown className="w-3 h-3 fill-amber-400" />
            <span>VIP Plan</span>
          </Link>
        </div>
      )}

      {/* =========================================================== */}
      {/* Responsive Mobile Drawer / Full Overlay                     */}
      {/* =========================================================== */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden fixed inset-0 top-[61px] bg-[#090A0E]/98 backdrop-blur-2xl border-t border-white/10 z-50 flex flex-col p-5 overflow-y-auto animate-in slide-in-from-top-4 duration-200 text-sm"
        >
          {/* Top User Status Card in Mobile Menu */}
          <div className="p-4 rounded-2xl bg-[#14161F] border border-white/10 mb-5 shadow-xl">
            {isGuest ? (
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-white text-base">Welcome to Kun Yeung</h3>
                  <p className="text-xs text-[#8E8E93]">Join our to save watchlists and discuss.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openAuthModal({ defaultTab: "signin" });
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs text-center transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openAuthModal({ defaultTab: "signup" });
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#EB0029] hover:bg-[#c00022] text-white font-bold text-xs text-center shadow-[0_0_15px_rgba(235,0,41,0.4)] transition-colors"
                  >
                    Join Free
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm overflow-hidden flex-shrink-0 ${
                      isAdminUser
                        ? "bg-[#EB0029]/20 text-[#EB0029] ring-2 ring-[#EB0029]"
                        : isPaidMember
                        ? "bg-[#FFD700]/20 text-[#FFD700] ring-2 ring-[#FFD700]"
                        : "bg-white/10 text-white ring-1 ring-white/20"
                    }`}
                  >
                    {!mobileAvatarError && avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        className="w-full h-full object-cover rounded-full"
                        onError={() => setMobileAvatarError(true)}
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-bold text-white text-sm truncate">{displayName}</p>
                      {isAdminUser && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#EB0029]/20 text-[#EB0029] border border-[#EB0029]/40">
                          Admin
                        </span>
                      )}
                      {isPaidMember && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40 flex items-center space-x-0.5">
                          <Crown className="w-2.5 h-2.5 fill-[#FFD700]" />
                          <span>VIP</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8E8E93] truncate">{displayEmail}</p>
                  </div>
                </div>

                {/* State CTA button in Mobile */}
                {isFreeUser && (
                  <Link
                    href="/pricing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#EB0029] text-white font-bold text-xs shadow-[0_0_15px_rgba(255,85,0,0.4)]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Upgrade: Go Premium</span>
                  </Link>
                )}

                {isAdminUser && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#EB0029] text-white font-black text-xs shadow-[0_0_15px_rgba(235,0,41,0.5)]"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Open Admin CMS</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links in Mobile Drawer */}
          <div className="space-y-1 mb-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 px-3 mb-1">
              Explore Catalog
            </p>
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left font-semibold transition-colors ${
                    isActive
                      ? "bg-[#EB0029]/15 text-[#EB0029] border border-[#EB0029]/30"
                      : "hover:bg-white/5 text-white/80 hover:text-white"
                  }`}
                >
                  <span>{tab}</span>
                  {isActive && <ArrowRight className="w-4 h-4" />}
                </button>
              );
            })}

            <Link
              href="/pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left font-bold text-amber-300 bg-amber-400/10 hover:bg-amber-400/15 border border-amber-400/25 transition-colors mt-1"
            >
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>VIP Club Membership</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </Link>
          </div>

          {/* State Specific Quick Links in Mobile Menu */}
          {!isGuest && (
            <div className="space-y-1 mb-5 pt-3 border-t border-white/10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 px-3 mb-1">
                Account &amp; Features
              </p>

              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-white/80 hover:text-white transition-colors"
              >
                <Bookmark className="w-4 h-4 text-[#8E8E93]" />
                <span>My Watchlist</span>
              </Link>

              {isPaidMember && (
                <>
                  <Link
                    href="/movies"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-white/80 hover:text-white transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-[#FFD700]" />
                    <span>Member Lounge</span>
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-white/80 hover:text-white transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-[#8E8E93]" />
                    <span>Billing &amp; Plan</span>
                  </Link>
                </>
              )}

              <Link
                href="/dashboard#settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-white/80 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4 text-[#8E8E93]" />
                <span>Account Settings</span>
              </Link>

              {isAdminUser && (
                <>
                  <Link
                    href="/admin/content"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-white/80 hover:text-white transition-colors"
                  >
                    <Film className="w-4 h-4 text-[#8E8E93]" />
                    <span>Film Content CMS</span>
                  </Link>
                  <Link
                    href="/admin/subscriptions"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-white/80 hover:text-white transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-[#8E8E93]" />
                    <span>Subscriptions Manager</span>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Sign Out Button in Mobile Drawer */}
          {!isGuest && (
            <div className="mt-auto pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={async () => {
                  setIsMobileMenuOpen(false);
                  await logout();
                }}
                className="w-full mt-4 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 font-bold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
