"use client";

import React from "react";
import { Sparkles, Shield, User as UserIcon } from "lucide-react";
import { UserState } from "@/types/user";

export interface UserBadgeProps {
  /**
   * The user's tier / role:
   * - 'free_user' -> Displays simply as "User"
   * - 'paid_member' -> Distinct glowing "Club Member" badge
   * - 'admin' -> Official "Admin" badge
   * - 'guest' -> Optional guest badge or null
   */
  tier?: UserState | string | null;
  className?: string;
  size?: "sm" | "md";
}

export default function UserBadge({
  tier = "free_user",
  className = "",
  size = "sm",
}: UserBadgeProps) {
  const normalizedTier = (tier || "").toLowerCase();

  // Admin Badge
  if (normalizedTier === "admin") {
    return (
      <span
        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.35)] ${className}`}
        title="Verified Platform Administrator"
      >
        <Shield className="w-3 h-3 text-red-400" />
        <span>Admin</span>
      </span>
    );
  }

  // VIP / Club Member Badge (Distinct glowing / colored)
  if (
    normalizedTier === "paid_member" ||
    normalizedTier === "member" ||
    normalizedTier === "active" ||
    normalizedTier === "vip"
  ) {
    const isVipText = normalizedTier === "vip" || normalizedTier === "active" || normalizedTier === "paid_member";
    return (
      <span
        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-gradient-to-r from-[#FF5500]/25 to-[#FF9F0A]/25 text-[#FF9F0A] border border-[#FF9F0A]/50 shadow-[0_0_14px_rgba(255,159,10,0.4)] ${className}`}
        title="Active VIP Member"
      >
        <Sparkles className="w-3 h-3 text-[#FF9F0A] animate-pulse" />
        <span>{isVipText ? "VIP Member" : "Club Member"}</span>
      </span>
    );
  }

  // Guest state (if explicitly requested)
  if (normalizedTier === "guest") {
    return (
      <span
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/40 border border-white/5 ${className}`}
      >
        <span>Guest</span>
      </span>
    );
  }

  // Free User: Displays simply as "User"
  return (
    <span
      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/70 border border-white/10 ${className}`}
      title="Standard Community Member"
    >
      <UserIcon className="w-2.5 h-2.5 text-white/50" />
      <span>User</span>
    </span>
  );
}
