"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  Terminal,
} from "lucide-react";
import { OnePlusSignSvg } from "@/components/OnePlusLogo";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/admin";

  const { user, isAdmin, setUser, checkAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // If already authenticated as admin, provide quick redirect
  useEffect(() => {
    if (isAdmin) {
      router.replace(redirectUrl);
    }
  }, [isAdmin, redirectUrl, router]);

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg("Please enter both administrator email and passphrase.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Administrative authentication failed.");
      }

      setSuccessMsg("Security verification passed. Unlocking Admin Console...");

      // Update client-side auth context immediately with verified user
      if (data.user) {
        setUser(data.user);
      }

      // Verify fresh session in background
      checkAuth().catch(() => {});

      // Redirect to full admin access
      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 700);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to authenticate administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background Cybernetic Ambient Glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#EB0029]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#FF9F0A]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Return to Public Stream button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-semibold backdrop-blur-md transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Film Club</span>
        </Link>
      </div>

      {/* Main Admin Security Card */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-400">
        {/* Top Header Badge */}
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E202B] to-[#0E0F15] border border-white/15 flex items-center justify-center shadow-[0_0_50px_rgba(255,184,0,0.3)] transition-transform group-hover:scale-105">
              <div className="w-10 h-10 drop-shadow-[0_0_12px_rgba(255,184,0,0.6)]">
                <OnePlusSignSvg />
              </div>
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#FFB800] border-2 border-[#070709] flex items-center justify-center shadow-lg">
              <Lock className="w-3 h-3 text-black stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="rounded-3xl bg-[#0F1017]/95 border border-white/15 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(255,184,0,0.06)] space-y-6">
          {/* Title & Security Notice */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#FFB800] text-[10px] font-black uppercase tracking-widest">
              <ShieldAlert className="w-3 h-3" />
              <span>Restricted • Admin Gateway</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Kun Yeung Admin Console
            </h1>
            <p className="text-xs text-white/50 leading-relaxed">
              Verify administrator credentials to access the full CMS, film catalog, and user rules.
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center space-x-2.5 animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider flex items-center justify-between">
                <span>Administrator Email</span>
                <span className="text-[10px] text-[#EB0029] lowercase font-mono">secure.auth</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  required
                  placeholder="admin@yourdomain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#EB0029] focus:ring-1 focus:ring-[#EB0029] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider flex items-center justify-between">
                <span>Security Passphrase</span>
                <span className="text-[10px] text-white/40 font-mono">••••••••</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter administrator password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#EB0029] focus:ring-1 focus:ring-[#EB0029] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Main Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#EB0029] to-[#FF2A4D] hover:brightness-110 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-[0_0_25px_rgba(235,0,41,0.4)] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize & Enter Admin Console</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Security Spec Badges */}
          <div className="pt-2 flex items-center justify-center space-x-4 text-[10px] text-white/40 font-mono">
            <span>• 256-bit Token</span>
            <span>• Role Guard</span>
            <span>• Audit Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
