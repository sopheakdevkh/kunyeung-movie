"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LensImpactLogo } from "@/components/OnePlusLogo";

// Password strength calculator
function computePasswordStrength(password: string): {
  score: number; // 0 to 4
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "None", color: "bg-white/10" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: "Weak", color: "bg-[#EB0029]" };
    case 2:
      return { score: 2, label: "Fair", color: "bg-[#FF9F0A]" };
    case 3:
      return { score: 3, label: "Good", color: "bg-[#00F0FF]" };
    case 4:
      return { score: 4, label: "Strong", color: "bg-emerald-400" };
    default:
      return { score: 0, label: "Too Short", color: "bg-white/20" };
  }
}

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/dashboard";

  const { register, isLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Strength score
  const strength = useMemo(() => computePasswordStrength(password), [password]);

  // Passwords matching check
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Client-side validations
    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    if (!agreeTerms) {
      setErrorMsg("You must agree to the Terms & Community Guidelines to create an account.");
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      email: email.trim(),
      password,
      full_name: fullName.trim(),
      redirectTo: redirectParam,
    });

    setIsSubmitting(false);
    if (!result.success) {
      setErrorMsg(result.error || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Cinematic Ambient Glow Background */}
      <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#EB0029]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-[#FF5500]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Brand Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-3">
        <div className="flex justify-center">
          <LensImpactLogo size="lg" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Create your account
        </h1>
        <p className="text-xs sm:text-sm text-[#8E8E93]">
          Join Kun Yeung to bookmark films, join discussion salons, and stream curated cinema.
        </p>

        {redirectParam !== "/dashboard" && (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EB0029]/15 border border-[#EB0029]/30 text-[#ff4d6a] text-xs font-semibold">
            <span>Locked feature access required • Register to continue</span>
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

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/90">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-[#EB0029] focus:ring-1 focus:ring-[#EB0029] transition-all"
                />
              </div>
            </div>

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
              <label className="block text-xs font-bold text-white/90">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="pt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/50">Strength:</span>
                    <span
                      className={`font-bold ${
                        strength.score === 1
                          ? "text-[#EB0029]"
                          : strength.score === 2
                          ? "text-[#FF9F0A]"
                          : strength.score === 3
                          ? "text-[#00F0FF]"
                          : "text-emerald-400"
                      }`}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`rounded-full h-full transition-all duration-300 ${
                          step <= strength.score ? strength.color : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/90">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none transition-all ${
                    passwordsMismatch
                      ? "border-[#EB0029] focus:border-[#EB0029]"
                      : passwordsMatch
                      ? "border-emerald-500/50 focus:border-emerald-400"
                      : "border-white/10 focus:border-[#EB0029]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-white/40 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Match Feedback Badge */}
              {confirmPassword.length > 0 && (
                <div className="flex items-center space-x-1 text-[11px] pt-0.5">
                  {passwordsMatch ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-[#ff4d6a] flex items-center gap-1 font-medium">
                      <XCircle className="w-3.5 h-3.5 text-[#EB0029]" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Terms & Community Guidelines Checkbox */}
            <div className="pt-2">
              <label className="flex items-start space-x-2.5 text-xs text-white/70 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-white/10 border-white/20 text-[#EB0029] focus:ring-0 cursor-pointer accent-[#EB0029]"
                />
                <span className="leading-snug">
                  I agree to the{" "}
                  <span className="text-white underline underline-offset-2 hover:text-[#EB0029]">
                    Terms of Service
                  </span>{" "}
                  &amp;{" "}
                  <span className="text-white underline underline-offset-2 hover:text-[#EB0029]">
                    Community Guidelines
                  </span>
                  .
                </span>
              </label>
            </div>

            {/* CTA Button: Brand Red */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full mt-3 py-3.5 px-4 rounded-xl bg-[#EB0029] hover:bg-[#ff143d] active:scale-[0.99] text-white font-black text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(235,0,41,0.45)] hover:shadow-[0_0_35px_rgba(235,0,41,0.65)] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-[#8E8E93]">
              Already a member?{" "}
              <Link
                href={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : "/login"}
                className="font-bold text-white hover:text-[#EB0029] transition-colors underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
