"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Sparkles,
  ArrowRight,
  UserCheck,
  ShieldAlert,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  AuthenticatedUserPayload,
  UserState,
  resolveUserState,
} from "@/types/user";

export type AccessLevel = "auth" | "member" | "admin";

export interface AccessGateProps {
  /**
   * Access level required to view the enclosed children:
   * - 'auth': requires authenticated account (free_user, paid_member, admin)
   * - 'member': requires active paid membership (paid_member, admin)
   * - 'admin': requires admin superuser privileges
   */
  requiredLevel: AccessLevel;

  /**
   * Optional custom UI to render when access is denied.
   * If not provided, default polished LensImpact paywall / prompt cards are rendered.
   */
  fallback?: React.ReactNode;

  /**
   * The protected content to gate.
   */
  children: React.ReactNode;

  /**
   * Optional direct user override (useful for Server Components or standalone tests).
   */
  user?: AuthenticatedUserPayload | null;

  /**
   * Optional toggle to show the interactive development tier switcher
   */
  showDevSwitcher?: boolean;

  /**
   * Custom className for the wrapper container
   */
  className?: string;
}

export default function AccessGate({
  requiredLevel,
  fallback,
  children,
  user: userProp,
  showDevSwitcher = false,
  className = "",
}: AccessGateProps) {
  const auth = useAuth();

  // If a direct user prop was passed, use it; otherwise use the context
  const currentUser = userProp !== undefined ? userProp : auth.user;
  const currentUserState: UserState =
    userProp !== undefined ? resolveUserState(userProp) : auth.userState;

  const [devStateOverride, setDevStateOverride] = useState<UserState | null>(null);
  const effectiveState = devStateOverride ?? currentUserState;

  // Determine if access criteria is satisfied
  const isAuthorized = (() => {
    switch (requiredLevel) {
      case "auth":
        // Any registered user (free, member, admin) has access. Only guest is denied.
        return effectiveState !== "guest";

      case "member":
        // Requires paid member or admin
        return effectiveState === "paid_member" || effectiveState === "admin";

      case "admin":
        // Requires admin status
        return effectiveState === "admin";

      default:
        return false;
    }
  })();

  // 1. Authorized: Render content with optional subtle badge
  if (isAuthorized) {
    return (
      <div className={`relative ${className}`}>
        {showDevSwitcher && (
          <DevRoleSwitcher
            current={effectiveState}
            onChange={setDevStateOverride}
            requiredLevel={requiredLevel}
          />
        )}
        {children}
      </div>
    );
  }

  // 2. Access Denied: If custom fallback was passed, render that
  if (fallback) {
    return (
      <div className={`relative ${className}`}>
        {showDevSwitcher && (
          <DevRoleSwitcher
            current={effectiveState}
            onChange={setDevStateOverride}
            requiredLevel={requiredLevel}
          />
        )}
        {fallback}
      </div>
    );
  }

  // 3. Default Behavior for requiredLevel === 'auth' and User is a Guest
  if (requiredLevel === "auth") {
    return (
      <div className={`relative w-full rounded-2xl border border-white/10 bg-[#0E1017] p-6 sm:p-8 shadow-xl ${className}`}>
        {showDevSwitcher && (
          <DevRoleSwitcher
            current={effectiveState}
            onChange={setDevStateOverride}
            requiredLevel={requiredLevel}
          />
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-semibold text-white/70">
              <UserCheck className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Community Access</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Create a free account to join the discussion and save to watchlists
            </h3>
            <p className="text-xs sm:text-sm text-[#8E8E93] leading-relaxed">
              Sign in or register in seconds to bookmark films, contribute your insights,
              and customize your personal cinema feed.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <Link
              href="/login"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold transition-all text-center flex items-center justify-center space-x-1.5 border border-white/10"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/signup"
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#ff6a1f] text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(255,85,0,0.35)] transition-all text-center flex items-center justify-center space-x-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Default Behavior for requiredLevel === 'member' and User is Free/Guest
  if (requiredLevel === "member") {
    return (
      <div className={`relative w-full rounded-3xl overflow-hidden border border-white/10 bg-[#0C0E14] shadow-2xl ${className}`}>
        {showDevSwitcher && (
          <DevRoleSwitcher
            current={effectiveState}
            onChange={setDevStateOverride}
            requiredLevel={requiredLevel}
          />
        )}

        {/* 
          Teaser preview container:
          Renders the first few lines of the text with a max-height cutoff,
          CSS blur, and opacity fade.
        */}
        <div
          className="relative max-h-36 sm:max-h-44 overflow-hidden select-none pointer-events-none p-6 text-white/40 blur-[2px]"
          aria-hidden="true"
        >
          {children}
        </div>

        {/* CSS Fade-Out Gradient Mask */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C0E14]/30 via-[#0C0E14]/85 to-[#0C0E14] pointer-events-none" />

        {/* Centered Paywall Card & Overlay */}
        <div className="relative z-10 -mt-10 sm:-mt-12 px-6 pb-8 pt-2 flex flex-col items-center text-center">
          <div className="max-w-lg w-full p-6 rounded-2xl bg-[#141622]/90 backdrop-blur-md border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.6)] space-y-4">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[#FFB800] text-[11px] font-extrabold uppercase tracking-wider shadow-[0_0_15px_rgba(255,184,0,0.2)]">
              <Lock className="w-3 h-3" />
              <span>Kun Yeung VIP Exclusive</span>
            </div>

            <h3 className="text-base sm:text-xl font-black text-white tracking-tight leading-snug">
              Unlock the full Impact &amp; Lesson Guide. Join Kun Yeung VIP for $4.99/mo
            </h3>

            <p className="text-xs text-[#8E8E93] leading-relaxed">
              Gain unlimited access to deep psychological breakdowns, director interview archives,
              and downloadable pedagogical guides.
            </p>

            <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-[#FF5500] to-[#EB0029] hover:brightness-110 text-white text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(255,184,0,0.4)] transition-all flex items-center justify-center space-x-2"
              >
                <span>Join Kun Yeung VIP</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Default Behavior for requiredLevel === 'admin'
  return (
    <div className={`p-6 rounded-2xl bg-[#1a0f12] border border-red-500/20 text-center space-y-3 ${className}`}>
      {showDevSwitcher && (
        <DevRoleSwitcher
          current={effectiveState}
          onChange={setDevStateOverride}
          requiredLevel={requiredLevel}
        />
      )}
      <ShieldAlert className="w-8 h-8 text-red-500 mx-auto" />
      <h3 className="text-base font-bold text-white">Administrator Access Required</h3>
      <p className="text-xs text-white/60 max-w-sm mx-auto">
        This section is restricted to LensImpact platform administrators and verified staff members.
      </p>
    </div>
  );
}

/**
 * Interactive preview bar for testing different user states in development
 */
function DevRoleSwitcher({
  current,
  onChange,
  requiredLevel,
}: {
  current: UserState;
  onChange: (state: UserState) => void;
  requiredLevel: AccessLevel;
}) {
  return (
    <div className="mb-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-[11px] text-white/70">
      <span className="flex items-center space-x-1.5">
        <Sparkles className="w-3 h-3 text-[#FF5500]" />
        <span className="font-semibold text-white/90">Preview As:</span>
      </span>
      <div className="flex items-center space-x-1">
        {(["guest", "free_user", "paid_member", "admin"] as UserState[]).map(
          (role) => {
            const isSelected = current === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => onChange(role)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#FF5500] text-white font-bold shadow-[0_0_8px_rgba(255,85,0,0.4)]"
                    : "text-white/50 hover:text-white/90 hover:bg-white/5"
                }`}
              >
                {role === "guest"
                  ? "Guest"
                  : role === "free_user"
                  ? "Free User"
                  : role === "paid_member"
                  ? "Paid Member"
                  : "Admin"}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}
