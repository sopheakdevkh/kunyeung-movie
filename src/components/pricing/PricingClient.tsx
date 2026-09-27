"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  Shield,
  Zap,
  BookOpen,
  Users,
  Download,
  Film,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Lock,
  HeartHandshake,
  Loader2,
  CheckCircle2,
  Crown,
} from "lucide-react";
import { LensImpactLogo } from "@/components/OnePlusLogo";
import StreamPulseFooter from "@/components/StreamPulseFooter";
import BackToCatalogButton from "@/components/BackToCatalogButton";
import { useAuth } from "@/context/AuthContext";

export default function PricingClient() {
  const { user, isAuthenticated, isMember, isAdmin, openAuthModal } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const isYearly = billingCycle === "yearly";

  const handleCheckout = async () => {
    // If guest, prompt login/signup first, then continue to Stripe checkout
    if (!isAuthenticated) {
      openAuthModal({
        title: "Sign in to Subscribe",
        subtitle: `Create a free account or sign in to activate your ${isYearly ? "Annual" : "Monthly"} VIP membership.`,
        defaultTab: "signup",
        onSuccess: () => {
          handleCheckout();
        },
      });
      return;
    }

    setIsLoading(true);
    setCheckoutStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: billingCycle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize checkout.");
      }

      setCheckoutStatus({
        type: "success",
        message: `Redirecting to secure Stripe Checkout... (Session ID: ${data.sessionId})`,
      });

      // Redirect user to Stripe Checkout session URL
      if (data.url) {
        setTimeout(() => {
          window.location.href = data.url;
        }, 800);
      } else {
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setCheckoutStatus({
        type: "error",
        message: errorMsg,
      });
      setIsLoading(false);
    }
  };

  const FAQS = [
    {
      question: "How do member payments support Kun Yeung?",
      answer:
        "100% of member subscriptions directly fund our dedicated team of film scholars, psychological analysts, and educators. Your support finances our deep narrative breakdowns, study syllabus creation, licensing fees, video lesson production, and private community curation.",
    },
    {
      question: "Can I switch between monthly and annual plans?",
      answer:
        "Yes, you can upgrade, downgrade, or switch your billing cycle at any time from your account settings. When switching to the annual plan ($49/year), you instantly save ~18% (equal to nearly 2 months free).",
    },
    {
      question: "What is included in the psychological & impact breakdowns?",
      answer:
        "Every featured film receives a comprehensive multidisciplinary essay and video companion exploring moral dilemmas, character archetypes, directorial symbolism, philosophical implications, and societal consequences.",
    },
    {
      question: "How do the printable study & lesson notes work?",
      answer:
        "Each film includes a downloadable, beautifully formatted PDF booklet with discussion prompts, key life lessons, reflective journal exercises, and recommended reading for cinema clubs and personal study.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Absolutely. There are no long-term contracts or cancellation fees. You will continue to have full premium access until the end of your current paid billing period.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#07080B] text-white flex flex-col select-none selection:bg-[#FF5500]/30 selection:text-white">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#07080B]/85 backdrop-blur-xl border-b border-white/5 py-4 px-4 sm:px-8 md:px-12 lg:px-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <LensImpactLogo size="md" href="/" />
          </div>

          <div className="flex items-center space-x-3">
            <BackToCatalogButton />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-8 md:px-12 lg:px-16 py-12 sm:py-16 max-w-7xl mx-auto">
        {/* Hero Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#FF5500]/10 border border-[#FF5500]/25 text-[#FF5500] text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,85,0,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Support Independent Cinema & Deep Analysis</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Invest in Meaningful Cinema &amp;{" "}
            <span className="bg-gradient-to-r from-white via-white/90 to-[#FF5500] bg-clip-text text-transparent">
              Psychological Depth
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#8E8E93] leading-relaxed">
            Elevate your perspective with in-depth psychological breakdowns, printable study notes,
            and an exclusive discussion community dedicated to films that change lives.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="pt-4 flex items-center justify-center">
            <div className="relative p-1 rounded-full bg-[#12141D] border border-white/10 flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`relative px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  !isYearly
                    ? "bg-[#FF5500] text-white shadow-[0_0_12px_rgba(255,85,0,0.5)]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`relative px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${
                  isYearly
                    ? "bg-[#FF5500] text-white shadow-[0_0_12px_rgba(255,85,0,0.5)]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Save 18%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Checkout Toast / Notification Banner */}
        {checkoutStatus.type && (
          <div
            className={`mt-8 max-w-xl mx-auto p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-center space-x-3 animate-in fade-in slide-in-from-top duration-200 ${
              checkoutStatus.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : "bg-red-950/40 border-red-500/40 text-red-300"
            }`}
          >
            {checkoutStatus.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <X className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className="flex-1">{checkoutStatus.message}</span>
          </div>
        )}

        {/* Pricing Cards Grid (2 Tiers) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 mt-12 items-stretch max-w-5xl mx-auto">
          {/* ========================================================= */}
          {/* TIER 1: FREE TIER                                         */}
          {/* ========================================================= */}
          <div className="relative rounded-3xl bg-[#0F1118]/80 border border-white/10 p-7 sm:p-9 flex flex-col justify-between hover:border-white/20 transition-all duration-300 shadow-xl backdrop-blur-sm">
            <div className="space-y-6">
              {/* Badge & Title */}
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-bold uppercase tracking-wider">
                  Public Access
                </span>
                <h3 className="text-2xl font-black text-white tracking-tight">Free Tier</h3>
                <p className="text-xs text-[#8E8E93]">
                  Essential access to explore public YouTube impact film selections with community ratings.
                </p>
              </div>

              {/* Pricing Display */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-white">$0</span>
                  <span className="text-xs text-[#8E8E93] font-medium">/ forever</span>
                </div>
                <p className="text-[11px] text-white/40 mt-1">No credit card required to start</p>
              </div>

              {/* Feature List */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50">Included Features:</p>
                <ul className="space-y-3 text-xs sm:text-sm text-white/80">
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Access to curated public YouTube impact film selections</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Public review comments &amp; audience ratings</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Standard community watchlist &amp; bookmarking</span>
                  </li>
                  <li className="flex items-start space-x-3 text-white/35">
                    <div className="w-5 h-5 rounded-full bg-white/5 text-white/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5" />
                    </div>
                    <span>In-depth psychological &amp; impact breakdowns</span>
                  </li>
                  <li className="flex items-start space-x-3 text-white/35">
                    <div className="w-5 h-5 rounded-full bg-white/5 text-white/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5" />
                    </div>
                    <span>Printable study &amp; lesson notes (PDF)</span>
                  </li>
                  <li className="flex items-start space-x-3 text-white/35">
                    <div className="w-5 h-5 rounded-full bg-white/5 text-white/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5" />
                    </div>
                    <span>Private community discussion club</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Button */}
            <div className="pt-8">
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => openAuthModal({ defaultTab: "signup" })}
                  className="w-full py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer text-center flex items-center justify-center space-x-2"
                >
                  <span>Start Free (No Card Needed)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : isMember || isAdmin ? (
                <div className="w-full py-3.5 px-6 rounded-2xl bg-white/5 text-white/50 border border-white/5 text-xs sm:text-sm font-semibold tracking-wide text-center flex items-center justify-center space-x-2">
                  <Check className="w-4 h-4 text-white/40" />
                  <span>Included with Membership</span>
                </div>
              ) : (
                <div className="w-full py-3.5 px-6 rounded-2xl bg-white/10 text-white/80 border border-white/15 text-xs sm:text-sm font-bold tracking-wide text-center flex items-center justify-center space-x-2">
                  <span>Current Plan</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* TIER 2: PREMIUM MEMBER TIER (FEATURED)                    */}
          {/* ========================================================= */}
          <div className="relative rounded-3xl bg-gradient-to-b from-[#181B26] to-[#0F1119] border-2 border-[#FF5500] p-7 sm:p-9 flex flex-col justify-between shadow-[0_0_40px_rgba(255,85,0,0.18)] hover:shadow-[0_0_50px_rgba(255,85,0,0.28)] transition-all duration-300">
            {/* Top Badge: Most Popular */}
            <div className="absolute -top-3.5 right-6 sm:right-8">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF5500] to-[#EB0029] text-white text-[11px] font-black uppercase tracking-wider shadow-lg">
                <Sparkles className="w-3 h-3 fill-white" />
                <span>Most Popular</span>
              </span>
            </div>

            <div className="space-y-6">
              {/* Badge & Title */}
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-[#FFB800]/15 border border-[#FFB800]/30 text-[#FFB800] text-xs font-bold uppercase tracking-wider">
                  Kun Yeung Member Circle
                </span>
                <h3 className="text-2xl font-black text-white tracking-tight">Premium Member</h3>
                <p className="text-xs text-[#8E8E93]">
                  Full access to our psychological library, lesson notes, private circles, and priority curation.
                </p>
              </div>

              {/* Pricing Display */}
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl sm:text-5xl font-black text-white">
                    {isYearly ? "$49" : "$4.99"}
                  </span>
                  <span className="text-xs text-[#8E8E93] font-medium">
                    {isYearly ? "/ year" : "/ month"}
                  </span>
                </div>
                <p className="text-[11px] text-[#FF5500] font-semibold mt-1">
                  {isYearly
                    ? "Just $4.08/mo (billed annually — 2 months free!)"
                    : "Billed monthly • Cancel anytime with one click"}
                </p>
              </div>

              {/* Feature List */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <p className="text-xs font-bold uppercase tracking-wider text-[#FF5500]">
                  Everything in Free, plus:
                </p>
                <ul className="space-y-3.5 text-xs sm:text-sm text-white">
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white">In-depth psychological &amp; impact breakdowns</span>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5">
                        Deep thematic deconstruction and character psychology for each film
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <Download className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white">Printable study/lesson notes &amp; key life takeaways</span>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5">
                        Structured PDF syllabus, discussion prompts, and journaling guides
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white">Private community discussion club</span>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5">
                        Monthly member salon, roundtable salons, and guest filmmaker Q&amp;As
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white">Ad-free reading &amp; early curation updates</span>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5">
                        Zero distractions plus 48-hour early preview on newly added analyses
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA Button with Checkout Trigger */}
            <div className="pt-8 space-y-2.5">
              {isMember ? (
                <div className="space-y-3">
                  <div className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs sm:text-sm font-black text-center flex items-center justify-center space-x-2 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Current Active Plan • VIP Member</span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="w-full py-3 px-6 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold text-center flex items-center justify-center space-x-2 transition-all border border-white/10"
                  >
                    <span>Go to VIP Dashboard &amp; Library</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : isAdmin ? (
                <div className="space-y-3">
                  <div className="w-full py-3.5 px-6 rounded-2xl bg-[#EB0029]/15 border border-[#EB0029]/40 text-[#EB0029] text-xs sm:text-sm font-black text-center flex items-center justify-center space-x-2">
                    <Shield className="w-4 h-4 text-[#EB0029]" />
                    <span>Admin Superuser • All Unlocked</span>
                  </div>
                  <Link
                    href="/admin"
                    className="w-full py-3 px-6 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold text-center flex items-center justify-center space-x-2 transition-all border border-white/10"
                  >
                    <span>Open Admin CMS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#EB0029] hover:from-[#ff6b1a] hover:to-[#ff1a40] text-white text-sm font-extrabold tracking-wide transition-all duration-200 shadow-[0_0_25px_rgba(255,85,0,0.45)] hover:shadow-[0_0_35px_rgba(255,85,0,0.6)] active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Secure Checkout...</span>
                      </>
                    ) : (
                      <>
                        <span>Upgrade to VIP</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center space-x-4 text-[11px] text-white/50 pt-1">
                    <span className="flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>256-bit SSL encrypted</span>
                    </span>
                    <span>•</span>
                    <span>Cancel anytime</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Value Guarantee / Mission Statement Callout */}
        <div className="mt-16 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#141620] via-[#161924] to-[#141620] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF5500]/15 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500] flex-shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Cinema as a Catalyst for Growth</h4>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Your subscription empowers independent creators, lesson writers, and mindful thinkers globally.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-xs text-white/70">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/80 border-2 border-[#12141D] flex items-center justify-center text-[10px] font-bold">
                SJ
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-500/80 border-2 border-[#12141D] flex items-center justify-center text-[10px] font-bold">
                AL
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-500/80 border-2 border-[#12141D] flex items-center justify-center text-[10px] font-bold">
                MK
              </div>
            </div>
            <span className="font-semibold">Join 4,200+ Film Club Members</span>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#FF5500]">
              <Shield className="w-3.5 h-3.5" />
              <span>Transparent Support</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#8E8E93]">
              Payments support original film analysis, lesson production, and community curation.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={faq.question}
                  className="rounded-2xl bg-[#0F1118] border border-white/10 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between text-sm sm:text-base font-bold text-white hover:text-[#FF5500] transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#FF5500] flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/50 flex-shrink-0 ml-2" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-[#8E8E93] leading-relaxed border-t border-white/5 pt-3 animate-in fade-in duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Global LensImpact Footer */}
      <StreamPulseFooter />
    </div>
  );
}
