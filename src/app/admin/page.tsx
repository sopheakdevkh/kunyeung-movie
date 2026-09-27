import React from "react";
import Link from "next/link";
import {
  Film,
  Star,
  Users,
  Plus,
  Cloud,
  ArrowRight,
  Database,
  MonitorPlay,
  Crown,
  Sparkles,
  UserCheck,
  Shield,
  Clock,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { getAdminStats, getAdminMovies } from "@/app/actions/movies";
import { getPosterCardUrl } from "@/lib/cloudinary";
import Image from "next/image";
import UserBadge from "@/components/comments/UserBadge";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  const movies = await getAdminMovies();
  const recentMovies = movies.slice(0, 5);

  const totalUsers = stats.totalUsers || 0;
  const vipUsers = stats.vipUsers || 0;
  const freeUsers = stats.freeUsers || 0;
  const adminUsers = stats.adminUsers || 0;

  // Percentage calculations
  const totalSubscribersBase = vipUsers + freeUsers;
  const vipPercentage =
    totalSubscribersBase > 0
      ? Math.round((vipUsers / totalSubscribersBase) * 100)
      : 0;
  const freePercentage =
    totalSubscribersBase > 0 ? 100 - vipPercentage : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-[#8E8E93] mt-1">
            Monitor streaming catalog metrics, VIP members, Free users, and subscription distribution.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Neon Database Status Badge */}
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Database className="w-3.5 h-3.5" />
            <span>Neon DB Connected</span>
          </div>

          <Link
            href="/admin/subscriptions"
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-all hover:border-[#FF9F0A]/40"
          >
            <Users className="w-4 h-4 text-[#FF9F0A]" />
            <span>Manage Subscriptions</span>
          </Link>

          <Link
            href="/admin/hero"
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-all"
          >
            <MonitorPlay className="w-4 h-4 text-[#FF5500]" />
            <span>Hero Banner</span>
          </Link>

          <Link
            href="/admin/content"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#EB0029] hover:from-[#ff6a1f] hover:to-[#ff1940] text-white text-xs font-bold shadow-[0_0_15px_rgba(255,85,0,0.3)] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Publish Film</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Total Subscription Users */}
        <div className="p-5 rounded-2xl bg-[#121318] border border-white/10 relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
              Total Subscription Users
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {totalUsers.toLocaleString()}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-blue-400 font-semibold inline-block">
              {totalSubscribersBase} Viewer Accounts
            </span>
            <span className="text-[10px] text-white/40">Neon DB Synced</span>
          </div>
        </div>

        {/* 2. VIP Members */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1c1811] via-[#121318] to-[#121318] border border-[#FF9F0A]/30 relative overflow-hidden group hover:border-[#FF9F0A]/60 shadow-[0_0_20px_rgba(255,159,10,0.08)] transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF9F0A]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold text-[#FF9F0A] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>VIP Members</span>
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FF9F0A]/20 text-[#FF9F0A] flex items-center justify-center border border-[#FF9F0A]/40 shadow-[0_0_12px_rgba(255,159,10,0.3)] group-hover:scale-110 transition-transform">
              <Crown className="w-4 h-4 fill-[#FF9F0A]" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-white tracking-tight relative z-10">
            {vipUsers.toLocaleString()}
          </p>
          <div className="flex items-center justify-between mt-1.5 relative z-10">
            <span className="text-[11px] text-[#FF9F0A] font-bold inline-block">
              {vipPercentage}% active club rate
            </span>
            <span className="text-[10px] text-[#FF9F0A]/70 uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-[#FF9F0A]/15 border border-[#FF9F0A]/25">
              Active VIP
            </span>
          </div>
        </div>

        {/* 3. Free Users */}
        <div className="p-5 rounded-2xl bg-[#121318] border border-white/10 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
              Free Users
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {freeUsers.toLocaleString()}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-emerald-400 font-semibold inline-block">
              {freePercentage}% standard tier
            </span>
            <span className="text-[10px] text-white/40">Community</span>
          </div>
        </div>

        {/* 4. Total Movies Catalog */}
        <div className="p-5 rounded-2xl bg-[#121318] border border-white/10 relative overflow-hidden group hover:border-[#FF5500]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
              Total Movies
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FF5500]/15 text-[#FF5500] flex items-center justify-center border border-[#FF5500]/20 group-hover:scale-110 transition-transform">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {stats.totalMovies}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-emerald-400 font-semibold inline-block">
              +100% active titles
            </span>
            <span className="text-[10px] text-white/40">
              {stats.topRatedMovies} Top Rated
            </span>
          </div>
        </div>
      </div>

      {/* DEDICATED MEMBERSHIP & SUBSCRIPTION BOARD */}
      <div className="rounded-2xl border border-white/10 bg-[#121318] p-6 space-y-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A] animate-pulse" />
              <h2 className="text-lg font-black text-white tracking-tight">
                Subscription &amp; Membership Board
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-semibold text-[#8E8E93] border border-white/10">
                Audience Distribution
              </span>
            </div>
            <p className="text-xs text-[#8E8E93]">
              Live breakdown of registered accounts across VIP Members, Free Viewers, and Administrators.
            </p>
          </div>

          <Link
            href="/admin/subscriptions"
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#FF9F0A] hover:text-[#ffb743] px-3.5 py-2 rounded-xl bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 hover:border-[#FF9F0A]/40 transition-all self-start sm:self-auto"
          >
            <span>Manage All Subscriptions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Visual Distribution Ratio Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A]" />
                <span>VIP Members ({vipUsers})</span>
              </span>
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Free Users ({freeUsers})</span>
              </span>
              {adminUsers > 0 && (
                <span className="flex items-center space-x-1.5 text-red-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span>Admin ({adminUsers})</span>
                </span>
              )}
            </div>
            <span className="text-[#8E8E93] text-[11px]">
              Total: {totalUsers} Registered Accounts
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex p-0.5 border border-white/10">
            {vipUsers > 0 && (
              <div
                style={{
                  width: `${Math.max(
                    (vipUsers / (totalUsers || 1)) * 100,
                    6
                  )}%`,
                }}
                className="h-full rounded-full bg-gradient-to-r from-[#FF5500] to-[#FF9F0A] shadow-[0_0_10px_rgba(255,159,10,0.5)] transition-all duration-500"
                title={`VIP Members: ${vipUsers}`}
              />
            )}
            {freeUsers > 0 && (
              <div
                style={{
                  width: `${Math.max(
                    (freeUsers / (totalUsers || 1)) * 100,
                    6
                  )}%`,
                }}
                className="h-full rounded-full bg-emerald-500/80 mx-0.5 transition-all duration-500"
                title={`Free Users: ${freeUsers}`}
              />
            )}
            {adminUsers > 0 && (
              <div
                style={{
                  width: `${Math.max(
                    (adminUsers / (totalUsers || 1)) * 100,
                    4
                  )}%`,
                }}
                className="h-full rounded-full bg-red-500/70 transition-all duration-500"
                title={`Admin: ${adminUsers}`}
              />
            )}
          </div>
        </div>

        {/* 3 Breakdown Pods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Board Card 1: Total Subscription User Base */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                Total Subscription Users
              </span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white">
              {totalUsers}
            </p>
            <p className="text-[11px] text-[#8E8E93]">
              All registered viewers stored in database with authentic session records.
            </p>
          </div>

          {/* Board Card 2: VIP Members */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#FF9F0A]/10 via-transparent to-transparent border border-[#FF9F0A]/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#FF9F0A] uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                <span>VIP Members</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/30">
                ACTIVE
              </span>
            </div>
            <p className="text-2xl font-black text-white">
              {vipUsers}
            </p>
            <p className="text-[11px] text-white/60">
              Unrestricted 4K streaming, offline KHQR manual overrides, and exclusive releases.
            </p>
          </div>

          {/* Board Card 3: Free Users */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Free Users
              </span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">
              {freeUsers}
            </p>
            <p className="text-[11px] text-[#8E8E93]">
              Standard free accounts with public catalog access and upgrade opportunities.
            </p>
          </div>
        </div>

        {/* Recent Members Quick Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Recent Registered &amp; Subscribed Members
            </h3>
            <Link
              href="/admin/subscriptions"
              className="text-[11px] font-semibold text-[#8E8E93] hover:text-white transition-colors"
            >
              View Full User Directory →
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider bg-white/[0.02]">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Membership Status</th>
                  <th className="py-2.5 px-3">Registered Date</th>
                  <th className="py-2.5 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-white/40">
                      No registered users found.
                    </td>
                  </tr>
                ) : (
                  stats.recentUsers.map((user) => {
                    const isVip =
                      user.subscriptionStatus === "active" &&
                      user.role !== "ADMIN";
                    const isAdmin = user.role === "ADMIN";
                    const isFree = !isVip && !isAdmin;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2.5">
                            <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-white/10 text-white font-bold text-[11px] flex items-center justify-center shrink-0 border border-white/10">
                              {user.avatar ? (
                                <Image
                                  src={user.avatar}
                                  alt={user.name || user.email}
                                  fill
                                  sizes="28px"
                                  className="object-cover"
                                />
                              ) : (
                                <span>{(user.name?.[0] || user.email[0] || "U").toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate max-w-[160px] sm:max-w-xs">
                                {user.name || "User"}
                              </p>
                              <p className="text-[11px] text-[#8E8E93] truncate max-w-[160px] sm:max-w-xs">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {isAdmin ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                              <Shield className="w-2.5 h-2.5" />
                              <span>Admin</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-white/60">
                              User
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {isAdmin ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-500/10 text-red-300 border border-red-500/20">
                              <span>Admin Access</span>
                            </span>
                          ) : isVip ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-gradient-to-r from-[#FF5500]/25 to-[#FF9F0A]/25 text-[#FF9F0A] border border-[#FF9F0A]/50 shadow-[0_0_10px_rgba(255,159,10,0.3)]">
                              <Crown className="w-3 h-3 fill-[#FF9F0A]" />
                              <span>VIP Member</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-white/5 text-white/60 border border-white/10">
                              <span>Free User</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-[#8E8E93]">
                          {new Date(user.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href="/admin/subscriptions"
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[11px] font-semibold border border-white/10 transition-colors"
                          >
                            <span>Manage</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Catalog Releases */}
      <div className="rounded-2xl border border-white/10 bg-[#121318] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Recent Catalog Releases
            </h2>
            <p className="text-xs text-[#8E8E93]">Latest movies ready for streaming</p>
          </div>

          <Link
            href="/admin/movies"
            className="flex items-center space-x-1.5 text-xs font-bold text-[#FF9F0A] hover:underline"
          >
            <span>View All Movies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-white/5">
          {recentMovies.map((movie) => {
            const thumb = getPosterCardUrl(movie.posterUrl, 120, 80);

            return (
              <div
                key={movie.id}
                className="py-3.5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="relative w-14 h-9 rounded-lg overflow-hidden bg-black/50 flex-shrink-0">
                    <Image
                      src={thumb}
                      alt={movie.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{movie.title}</h3>
                    <p className="text-[11px] text-[#8E8E93]">
                      {movie.releaseYear} • {movie.genres.map((g) => g.name).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-xs font-bold text-[#FF9F0A] flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 fill-[#FF9F0A]" />
                    <span>{movie.rating.toFixed(1)}</span>
                  </span>

                  <span className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-white">
                    {movie.certification}
                  </span>

                  {movie.isTopRated && (
                    <span className="px-2 py-0.5 rounded-full bg-[#FF9F0A]/20 text-[#FF9F0A] text-[10px] font-extrabold border border-[#FF9F0A]/30">
                      TOP RATED
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
