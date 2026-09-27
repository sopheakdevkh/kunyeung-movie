"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Sparkles,
  BookOpen,
  Download,
  Users,
  Film,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Crown,
  Settings as SettingsIcon,
  User as UserIcon,
  Mail,
  Calendar,
  Lock,
  Bookmark,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Shield,
  Clock,
  Tv,
  Upload,
  Camera,
  Trash2,
} from "lucide-react";
import { LensImpactLogo } from "@/components/OnePlusLogo";
import StreamPulseFooter from "@/components/StreamPulseFooter";
import BackToCatalogButton from "@/components/BackToCatalogButton";
import { useAuth } from "@/context/AuthContext";

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

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const isPaymentSuccess = searchParams.get("payment") === "success";
  const sessionId = searchParams.get("session_id");

  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    userState,
    isMember,
    isAdmin,
    openAuthModal,
    checkAuth,
  } = useAuth();

  // Navigation tab state (overview vs settings)
  const [activeTab, setActiveTab] = useState<"overview" | "settings">("overview");

  // Watch history & queue dynamic stats
  const [historyStats, setHistoryStats] = useState<{
    historyCount: number;
    watchlistCount: number;
    totalCount: number;
  }>({ historyCount: 0, watchlistCount: 0, totalCount: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Profile edit state
  const [displayName, setDisplayName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Avatar upload state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Automatically verify Stripe payment session and upgrade user to active VIP
  useEffect(() => {
    if (!sessionId || !isPaymentSuccess) return;

    let isMounted = true;
    fetch("/api/checkout/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          checkAuth();
        }
      })
      .catch((err) => {
        console.error("Failed to verify checkout session:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId, isPaymentSuccess, checkAuth]);

  // Sync hash (#settings) on mount and on hash changes
  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== "undefined" && window.location.hash === "#settings") {
        setActiveTab("settings");
      } else {
        setActiveTab("overview");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Update URL hash when switching tabs manually
  const handleTabSwitch = (tab: "overview" | "settings") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const newHash = tab === "settings" ? "#settings" : "";
      window.history.replaceState(null, "", window.location.pathname + newHash);
    }
  };

  // Populate display name and avatar when user loads
  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    } else if (user?.email) {
      setDisplayName(user.email.split("@")[0]);
    }
    if (user?.avatar) {
      setAvatarUrl(user.avatar);
    } else {
      setAvatarUrl(null);
    }
  }, [user]);

  // Handle Avatar File Upload
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage({ type: "error", text: "Image file exceeds 5MB limit." });
      return;
    }

    setAvatarMessage(null);
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to upload avatar.");
      }

      setAvatarUrl(data.avatar);
      setAvatarMessage({ type: "success", text: "Profile image updated successfully!" });
      await checkAuth();
    } catch (err: any) {
      setAvatarMessage({ type: "error", text: err.message || "Failed to upload avatar." });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle Remove Avatar
  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    setAvatarMessage(null);
    try {
      const res = await fetch("/api/user/avatar", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to remove avatar.");
      }
      setAvatarUrl(null);
      setAvatarMessage({ type: "success", text: "Avatar removed. Reverted to initials." });
      await checkAuth();
    } catch (err: any) {
      setAvatarMessage({ type: "error", text: err.message || "Failed to remove avatar." });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Fetch watch history counts for dynamic dashboard metrics
  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoadingStats(true);
    fetch("/api/watch-history")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load history stats");
        return res.json();
      })
      .then((data) => {
        setHistoryStats({
          historyCount: data.historyCount || 0,
          watchlistCount: data.watchlistCount || 0,
          totalCount: data.totalCount || 0,
        });
      })
      .catch((err) => {
        console.warn("Could not load history stats:", err);
      })
      .finally(() => {
        setIsLoadingStats(false);
      });
  }, [isAuthenticated]);

  // Handle Profile Update (PATCH /api/auth/me)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setIsUpdatingProfile(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to update profile.");
      }

      setProfileMessage({ type: "success", text: "Profile name updated successfully!" });
      await checkAuth();
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "Error updating profile." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Change (PATCH /api/auth/me)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to change password.");
      }

      setPasswordMessage({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage({ type: "error", text: err.message || "Error changing password." });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Loading state during auth determination
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#07080B] text-white flex flex-col justify-between">
        <header className="py-4 px-4 sm:px-8 border-b border-white/5 flex items-center justify-between">
          <LensImpactLogo size="md" href="/" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#8E8E93] font-medium tracking-wide">
            Loading your member profile...
          </p>
        </div>
        <StreamPulseFooter />
      </div>
    );
  }

  // Unauthenticated Guest View
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#07080B] text-white flex flex-col justify-between select-none">
        <header className="sticky top-0 z-50 bg-[#07080B]/90 backdrop-blur-xl border-b border-white/5 py-4 px-4 sm:px-8 md:px-12 lg:px-16 flex items-center justify-between">
          <LensImpactLogo size="md" href="/" />
          <BackToCatalogButton />
        </header>

        <main className="flex-1 max-w-lg mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#FF5500]/10 border border-[#FF5500]/25 flex items-center justify-center text-[#FF5500] mb-5 shadow-[0_0_30px_rgba(255,85,0,0.2)]">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            Member Authentication Required
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8E93] mb-8 leading-relaxed">
            Please sign in to access your personal dashboard, saved queue, and VIP subscription settings.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => openAuthModal({ defaultTab: "signin" })}
              className="w-full sm:w-1/2 py-3 px-6 rounded-full bg-gradient-to-r from-[#FF5500] to-[#EB0029] hover:from-[#ff6b1a] hover:to-[#ff1a40] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#EB0029]/25 transition-all cursor-pointer"
            >
              Sign In
            </button>
            <Link
              href="/"
              className="w-full sm:w-1/2 py-3 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 text-xs sm:text-sm font-semibold text-center transition-all cursor-pointer"
            >
              Browse Catalog
            </Link>
          </div>
        </main>

        <StreamPulseFooter />
      </div>
    );
  }

  // Determine user information
  const initials = getUserInitials(user.name, user.email);
  const userFullName = user.name || user.email.split("@")[0];
  const userEmail = user.email;
  const isPaidUser = isMember || user.subscription_status === "active";
  const userRole = user.role || "user";
  const displayAvatarSrc =
    avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName || "User")}&background=FF5500&color=ffffff&bold=true&font-size=0.45&rounded=true&size=160`;
  const memberSinceFormatted = user.created_at || user.createdAt
    ? new Date(user.created_at || user.createdAt!).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Member";

  return (
    <div className="min-h-screen bg-[#07080B] text-white flex flex-col select-none selection:bg-[#FF5500]/30 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#07080B]/90 backdrop-blur-xl border-b border-white/5 py-4 px-4 sm:px-8 md:px-12 lg:px-16">
        <div className="flex items-center justify-between">
          <LensImpactLogo size="md" href="/" />

          <div className="flex items-center space-x-3">
            <BackToCatalogButton />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
        {/* Payment Success Banner */}
        {isPaymentSuccess && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#10221B] to-emerald-950/60 border border-emerald-500/40 shadow-[0_0_35px_rgba(16,185,129,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
                  <Sparkles className="w-3 h-3" />
                  <span>VIP Membership Activated</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Welcome to LensImpact VIP, {userFullName}!
                </h2>
                <p className="text-xs sm:text-sm text-emerald-200/80 mt-0.5">
                  Your recurring subscription is active. You now have full access to in-depth psychological breakdowns and lesson notes.
                </p>
                {sessionId && (
                  <p className="text-[10px] text-white/40 font-mono mt-1">
                    Reference ID: {sessionId}
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors flex items-center space-x-1.5 flex-shrink-0 shadow-lg shadow-emerald-500/20"
            >
              <span>Explore VIP Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* User Hero Profile HUD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0F1118] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5500]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-white/5 pb-6">
            <div className="flex items-center space-x-4">
              {/* Avatar circle with image or initials */}
              <div className="relative group/avatar flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#12141D] flex items-center justify-center text-white font-black text-xl sm:text-2xl tracking-wider overflow-hidden shadow-[0_0_20px_rgba(255,85,0,0.3)]">
                    <img
                      src={displayAvatarSrc}
                      alt={userFullName}
                      className="w-full h-full object-cover"
                    />
                </div>
                {/* Quick Edit Overlay Button */}
                <button
                  onClick={() => handleTabSwitch("settings")}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#181A24] border border-white/20 text-white/80 hover:text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                  title="Upload / Change profile avatar"
                >
                  <Camera className="w-3.5 h-3.5 text-[#FF5500]" />
                </button>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5500]">
                    {isAdmin ? "Admin Console" : isPaidUser ? "VIP Member" : "Community"}
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-[11px] text-white/50">Joined {memberSinceFormatted}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                  {userFullName}
                </h1>
                <p className="text-xs text-[#8E8E93] mt-0.5 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-white/40" />
                  <span>{userEmail}</span>
                </p>
              </div>
            </div>

            {/* Plan Tier Pill */}
            <div className="self-start sm:self-center">
              {isAdmin ? (
                <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-[#EB0029]/20 border border-[#EB0029]/40 text-[#EB0029] text-xs font-bold shadow-[0_0_15px_rgba(235,0,41,0.2)]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Platform Administrator</span>
                </div>
              ) : isPaidUser ? (
                <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-[#EB0029]/20 border border-amber-400/40 text-amber-300 text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>VIP Member</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/15 text-white/80 text-xs font-bold">
                  <UserIcon className="w-3.5 h-3.5 text-white/50" />
                  <span>Free User</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#141620] border border-white/5">
              <span className="text-[11px] text-[#8E8E93] font-medium block">Watch Queue</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-xl sm:text-2xl font-black text-white">
                  {isLoadingStats ? "..." : historyStats.totalCount}
                </span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#141620] border border-white/5">
              <span className="text-[11px] text-[#8E8E93] font-medium block">Account Tier</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className={`text-base sm:text-lg font-black ${isPaidUser ? "text-amber-400" : "text-white"}`}>
                  {isAdmin ? "Admin" : isPaidUser ? "VIP Member" : "Free"}
                </span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#141620] border border-white/5">
              <span className="text-[11px] text-[#8E8E93] font-medium block">Study Notes</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-xl sm:text-2xl font-black text-[#FF5500]">
                  {isPaidUser ? "Full Access" : "Preview"}
                </span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#141620] border border-white/5">
              <span className="text-[11px] text-[#8E8E93] font-medium block">Streaming</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-xl sm:text-2xl font-black text-[#FF5500]">
                  {isPaidUser ? "4K UHD" : "1080p HD"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs: Overview vs Settings */}
        <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
          <button
            type="button"
            onClick={() => handleTabSwitch("overview")}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === "overview"
                ? "bg-white/10 text-white border border-white/20 shadow-md"
                : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Overview &amp; Perks</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch("settings")}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === "settings"
                ? "bg-white/10 text-white border border-white/20 shadow-md"
                : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Account Settings</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* If Free User, display Upgrade Callout Banner */}
            {!isPaidUser && !isAdmin && (
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#1E1714] via-[#241B19] to-[#1E1714] border border-[#FF5500]/30 shadow-[0_0_30px_rgba(255,85,0,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FF5500]/20 text-[#FF5500] text-[10px] font-bold uppercase tracking-wider">
                    <Crown className="w-3.5 h-3.5 fill-[#FF5500]" />
                    <span>Elevate Your Experience</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Upgrade to LensImpact VIP Membership
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8E8E93] leading-relaxed">
                    Unlock complete psychological breakdowns, moral dilemmatic essays, printable syllabus PDFs, and join private discussions.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FF5500] to-[#EB0029] hover:from-[#ff6b1a] hover:to-[#ff1a40] text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(235,0,41,0.5)] transition-all flex items-center space-x-2 flex-shrink-0"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>View VIP Plans</span>
                </Link>
              </div>
            )}

            {/* Perks Cards */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0F1118] border border-white/10 space-y-6 shadow-xl">
              <div>
                <h3 className="text-lg font-black text-white">Your Streaming Features</h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Included with your current {isPaidUser ? "VIP Membership" : "Community account"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#141620] border border-white/5 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-[#FF5500]/15 text-[#FF5500] flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Psychological Breakdowns</h4>
                  <p className="text-xs text-[#8E8E93] leading-relaxed">
                    {isPaidUser
                      ? "Full unrestricted access to character archetypes, director symbolism, and moral dilemmas."
                      : "Teaser previews available. Upgrade to unlock complete 15-page essays."}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#141620] border border-white/5 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-[#FF5500]/15 text-[#FF5500] flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Printable Study Guides</h4>
                  <p className="text-xs text-[#8E8E93] leading-relaxed">
                    {isPaidUser
                      ? "Download high-res PDF lesson notes, journaling prompts, and discussion agendas."
                      : "Downloadable PDF syllabus guides are exclusive to active VIP Club Members."}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#141620] border border-white/5 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-[#FF5500]/15 text-[#FF5500] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Private Discussion Club</h4>
                  <p className="text-xs text-[#8E8E93] leading-relaxed">
                    {isPaidUser
                      ? "Participate in monthly community salons and exclusive roundtable critiques."
                      : "Public review ratings active. VIP members join private salons."}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="px-6 py-3 rounded-full bg-[#FF5500] hover:bg-[#ff661a] text-white font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 shadow-[0_0_15px_rgba(255,85,0,0.4)]"
                >
                  <Film className="w-4 h-4" />
                  <span>Start Watching Now</span>
                </Link>
                <Link
                  href="/pricing"
                  className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-semibold text-xs sm:text-sm transition-all border border-white/10 hover:border-white/20"
                >
                  {isPaidUser ? "Manage Subscription" : "Upgrade Plan"}
                </Link>
                <button
                  type="button"
                  onClick={() => handleTabSwitch("settings")}
                  className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-semibold text-xs sm:text-sm transition-all border border-white/10 hover:border-white/20 flex items-center space-x-1.5"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACCOUNT SETTINGS (#settings) */}
        {activeTab === "settings" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* 1. Profile Details Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0F1118] border border-white/10 space-y-6 shadow-xl">
              <div>
                <h3 className="text-lg font-black text-white">Profile Information</h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Update your display name, upload a profile photo, and review credentials.
                </p>
              </div>

              {/* Profile Avatar Upload & Management */}
              <div className="p-5 rounded-2xl bg-[#141620] border border-white/5 space-y-4 max-w-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    {/* Preview circle */}
                    <div className="relative w-16 h-16 rounded-2xl bg-[#12141D] flex items-center justify-center text-white font-black text-xl tracking-wider overflow-hidden shadow-[0_0_15px_rgba(255,85,0,0.25)] flex-shrink-0">
                        <img
                          src={displayAvatarSrc}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 rounded-2xl bg-black/75 backdrop-blur-xs flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-[#FF5500] animate-spin" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                        <span>Profile Photo</span>
                        {avatarUrl ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            Custom Uploaded Avatar
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                            Auto-Generated Avatar
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-[#8E8E93] mt-0.5">
                        Upload your profile image (all roles supported: Free, VIP, Admin).
                      </p>
                    </div>
                  </div>

                  {/* Upload and Remove Buttons */}
                  <div className="flex items-center space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      onChange={handleAvatarFileSelect}
                      className="hidden"
                      id="avatar-file-input"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#EB0029] hover:from-[#ff6b1a] hover:to-[#ff1a40] text-white text-xs font-bold transition-all flex items-center space-x-2 shadow-md disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingAvatar ? "Uploading..." : avatarUrl ? "Change Photo" : "Upload Photo"}</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar}
                        className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-all border border-red-500/20 disabled:opacity-50 cursor-pointer flex items-center space-x-1"
                        title="Remove custom photo and reset to initials"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    )}
                  </div>
                </div>

                {avatarMessage && (
                  <div
                    className={`p-3 rounded-xl flex items-center space-x-2 text-xs font-medium ${
                      avatarMessage.type === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400"
                        : "bg-[#EB0029]/10 border border-[#EB0029]/25 text-[#EB0029]"
                    }`}
                  >
                    {avatarMessage.type === "success" ? (
                      <Check className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{avatarMessage.text}</span>
                  </div>
                )}

                <p className="text-[11px] text-white/40">
                  Supports JPG, PNG, WebP, GIF or SVG up to 5MB. Visible across Community discussions and profile badges.
                </p>
              </div>

              {profileMessage && (
                <div
                  className={`p-4 rounded-2xl flex items-center space-x-2 text-xs font-semibold ${
                    profileMessage.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400"
                      : "bg-[#EB0029]/10 border border-[#EB0029]/25 text-[#EB0029]"
                  }`}
                >
                  {profileMessage.type === "success" ? (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    maxLength={50}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-2xl bg-[#141620] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#FF5500] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={userEmail}
                      disabled
                      className="w-full px-4 py-3 rounded-2xl bg-[#141620]/60 border border-white/5 text-white/50 text-xs sm:text-sm cursor-not-allowed select-text"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-1">
                    Email cannot be changed directly for security purposes.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF5500] to-[#EB0029] hover:from-[#ff6b1a] hover:to-[#ff1a40] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <span>Save Profile</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Membership & Billing Section */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0F1118] border border-white/10 space-y-6 shadow-xl">
              <div>
                <h3 className="text-lg font-black text-white">Membership &amp; Subscription Plan</h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Manage your subscription status, payment methods, and perks.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#141620] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">
                      {isAdmin ? "Administrator Plan" : isPaidUser ? "LensImpact VIP Club Membership" : "Free Community Tier"}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      {isPaidUser ? "Active" : "Public"}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8E93]">
                    {isPaidUser
                      ? "Full 4K UHD streaming, moral dissections, and PDF lesson downloads are unlocked."
                      : "Public YouTube impact streaming. Upgrade anytime to unlock comprehensive breakdowns."}
                  </p>
                </div>

                <Link
                  href="/pricing"
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 flex-shrink-0 cursor-pointer ${
                    isPaidUser
                      ? "bg-white/10 hover:bg-white/20 text-white border border-white/15"
                      : "bg-gradient-to-r from-[#FF5500] to-[#EB0029] text-white shadow-[0_0_15px_rgba(255,85,0,0.4)]"
                  }`}
                >
                  <span>{isPaidUser ? "Manage Billing" : "Upgrade to VIP"}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* 3. Security & Password Update */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0F1118] border border-white/10 space-y-6 shadow-xl">
              <div>
                <h3 className="text-lg font-black text-white">Security &amp; Password</h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Change your account login password.
                </p>
              </div>

              {passwordMessage && (
                <div
                  className={`p-4 rounded-2xl flex items-center space-x-2 text-xs font-semibold ${
                    passwordMessage.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400"
                      : "bg-[#EB0029]/10 border border-[#EB0029]/25 text-[#EB0029]"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 rounded-2xl bg-[#141620] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#FF5500] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-3 rounded-2xl bg-[#141620] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#FF5500] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-3 rounded-2xl bg-[#141620] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#FF5500] transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/15 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <StreamPulseFooter />
    </div>
  );
}
