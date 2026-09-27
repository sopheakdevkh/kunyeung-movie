"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LensImpactLogo } from "@/components/OnePlusLogo";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/dashboard";

  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both your email address and password.");
      return;
    }

    setIsSubmitting(true);
    const result = await login({
      email: email.trim(),
      password,
      redirectTo: redirectParam,
    });

    setIsSubmitting(false);
    if (!result.success) {
      setErrorMsg(result.error || "Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Cinematic Ambient Glow Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#EB0029]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#FF5500]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Brand Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-3">
        <div className="flex justify-center">
          <LensImpactLogo size="lg" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-[#8E8E93]">
          Sign in to access your curated cinema feed, watchlists, and salon discussions.
        </p>

        {redirectParam !== "/dashboard" && (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EB0029]/15 border border-[#EB0029]/30 text-[#ff4d6a] text-xs font-semibold">
            <span>Locked feature access required • Sign in to proceed</span>
          </div>
        )}
      </div>

      {/* Card Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-[#14151b]/90 backdrop-blur-xl border border-white/10 py-8 px-6 sm:px-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-6">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#EB0029]/15 border border-[#EB0029]/40 text-[#ff4d6a] text-xs flex items-start space-x-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#EB0029] mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/90">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cinephile@lensimpact.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-[#EB0029] focus:ring-1 focus:ring-[#EB0029] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-white/90">Password</label>
                <button
                  type="button"
                  onClick={() => alert("Password reset link has been simulated. In demo mode, sign in with your email or register a new free account.")}
                  className="text-[11px] text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-[#EB0029] focus:ring-1 focus:ring-[#EB0029] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-white/40 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-white/70 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-white/10 border-white/20 text-[#EB0029] focus:ring-0 cursor-pointer accent-[#EB0029]"
                />
                <span>Remember this device</span>
              </label>
            </div>

            {/* CTA Button: Brand Red */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#EB0029] hover:bg-[#ff143d] active:scale-[0.99] text-white font-black text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(235,0,41,0.45)] hover:shadow-[0_0_35px_rgba(235,0,41,0.65)] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-[#8E8E93]">
              New to Kun Yeung?{" "}
              <Link
                href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : "/register"}
                className="font-bold text-white hover:text-[#FFB800] transition-colors underline underline-offset-4"
              >
                Join Free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
