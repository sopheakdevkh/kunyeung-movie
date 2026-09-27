"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Shield,
  Sparkles,
  Calendar,
  Clock,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  FileText,
  Lock,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import UserBadge from "@/components/comments/UserBadge";

export interface AdminUserRecord {
  id: string;
  name?: string | null;
  email: string;
  avatar?: string | null;
  role: string;
  subscriptionStatus: "free" | "active" | "past_due" | "cancelled" | string;
  subscriptionTier?: string | null;
  subscriptionEndDate?: string | Date | null;
  createdAt: string | Date;
}

interface SubscriptionManagerClientProps {
  initialUsers?: AdminUserRecord[];
}

export default function SubscriptionManagerClient({
  initialUsers = [],
}: SubscriptionManagerClientProps) {
  const [users, setUsers] = useState<AdminUserRecord[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal State
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<"free" | "active">("active");
  const [overrideDate, setOverrideDate] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState<string>("Paid via Bakong/KHQR offline");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions");
      if (res.ok) {
        const data = await res.json();
        if (data.users) setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to refresh users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialUsers.length === 0) {
      fetchUsers();
    }
  }, []);

  const openOverrideModal = (user: AdminUserRecord) => {
    setSelectedUser(user);
    setOverrideStatus(user.subscriptionStatus === "active" ? "active" : "active");

    // Format current or default date (+1 month)
    if (user.subscriptionEndDate) {
      const d = new Date(user.subscriptionEndDate);
      setOverrideDate(d.toISOString().split("T")[0]);
    } else {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setOverrideDate(nextMonth.toISOString().split("T")[0]);
    }

    setOverrideReason("Paid via Bakong/KHQR offline");
  };

  const closeOverrideModal = () => {
    setSelectedUser(null);
  };

  const handleApplyPreset = (months: number | "lifetime") => {
    if (months === "lifetime") {
      setOverrideDate("");
      return;
    }
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setOverrideDate(d.toISOString().split("T")[0]);
  };

  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          email: selectedUser.email,
          subscriptionStatus: overrideStatus,
          expirationDate: overrideStatus === "active" ? (overrideDate || null) : null,
          reason: overrideReason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update local state
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? {
                  ...u,
                  subscriptionStatus: overrideStatus,
                  subscriptionEndDate:
                    overrideStatus === "active"
                      ? overrideDate
                        ? new Date(overrideDate).toISOString()
                        : null
                      : null,
                }
              : u
          )
        );
        triggerToast(
          `Updated ${selectedUser.email}: status '${overrideStatus}' (${overrideReason})`
        );
        closeOverrideModal();
      } else {
        alert(data.error || "Failed to override subscription.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while submitting override.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    if (statusFilter === "admin") return u.role.toLowerCase() === "admin";
    return u.subscriptionStatus.toLowerCase() === statusFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141622] border border-[#FF5500]/50 text-white text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Bar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#121318] border border-white/10">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by user email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5500] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/5 text-[11px] font-semibold">
            {["all", "active", "free", "admin"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  statusFilter === f
                    ? "bg-[#FF5500] text-white font-bold shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {f === "admin" ? "Admins" : f}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Refresh user list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#FF5500]" : ""}`} />
          </button>
        </div>
      </div>

      {/* User & Subscription Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E1017] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[#8E8E93] uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4">User Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Subscription Status</th>
                <th className="py-3.5 px-4">Expiration Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/40">
                    No users matching the query or filter.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isActive = u.subscriptionStatus.toLowerCase() === "active";
                  const isAdminRole = u.role.toLowerCase() === "admin";
                  const isExpired =
                    isActive &&
                    u.subscriptionEndDate &&
                    new Date(u.subscriptionEndDate).getTime() < Date.now();

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* 1. User Email & Details with Profile Image */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#FF5500]/20 to-[#FF9F0A]/20 border border-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm">
                            {u.avatar ? (
                              <Image
                                src={u.avatar}
                                alt={u.name || u.email}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            ) : (
                              <span>{u.name ? u.name[0].toUpperCase() : u.email[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white tracking-tight">
                              {u.email}
                            </div>
                            {u.name && (
                              <div className="text-[11px] text-white/50">{u.name}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Role */}
                      <td className="py-4 px-4">
                        {isAdminRole ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                            <Shield className="w-3 h-3" />
                            <span>ADMIN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/70 border border-white/10">
                            USER
                          </span>
                        )}
                      </td>

                      {/* 3. Subscription Status */}
                      <td className="py-4 px-4">
                        {isActive && !isExpired ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Active Member</span>
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <span>Expired</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/50 border border-white/5">
                            Free Tier
                          </span>
                        )}
                      </td>

                      {/* 4. Expiration Date */}
                      <td className="py-4 px-4 text-white/70">
                        {isAdminRole ? (
                          <span className="text-white/40 text-[11px]">Lifetime Superuser</span>
                        ) : u.subscriptionEndDate ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5 text-xs text-white">
                              <Calendar className="w-3.5 h-3.5 text-[#FF5500]" />
                              <span>
                                {new Date(u.subscriptionEndDate).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="text-[10px] text-white/40">
                              {Math.ceil(
                                (new Date(u.subscriptionEndDate).getTime() - Date.now()) /
                                  (1000 * 60 * 60 * 24)
                              )}{" "}
                              days remaining
                            </div>
                          </div>
                        ) : (
                          <span className="text-white/30 text-[11px]">—</span>
                        )}
                      </td>

                      {/* 5. Actions: Manual Subscription Override */}
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openOverrideModal(u)}
                          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-[#FF5500]/15 text-white/80 hover:text-[#FF5500] border border-white/10 hover:border-[#FF5500]/40 text-xs font-semibold transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-sm"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Manual Override</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (5 users per page) */}
        {filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 border-t border-white/5 bg-white/[0.01]">
            <div className="text-xs text-[#8E8E93]">
              Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-white">
                {Math.min(startIndex + PAGE_SIZE, filteredUsers.length)}
              </span>{" "}
              of <span className="font-semibold text-white">{filteredUsers.length}</span> users
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer text-xs font-semibold"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-[#FF5500] to-[#EB0029] text-white shadow-[0_0_10px_rgba(255,85,0,0.4)]"
                        : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer text-xs font-semibold"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MANUAL SUBSCRIPTION OVERRIDE MODAL                         */}
      {/* ========================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-3xl bg-[#0F1118] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={closeOverrideModal}
              className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-[#FF5500]/20 to-[#FF9F0A]/20 border border-white/10 flex items-center justify-center font-bold text-white text-sm shrink-0">
                  {selectedUser.avatar ? (
                    <Image
                      src={selectedUser.avatar}
                      alt={selectedUser.name || selectedUser.email}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <span>{(selectedUser.name?.[0] || selectedUser.email[0]).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#FF5500]/15 border border-[#FF5500]/30 text-[#FF5500] text-[10px] font-extrabold uppercase tracking-wider mb-0.5">
                    <Shield className="w-3 h-3" />
                    <span>Admin Privileges</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Manual Subscription Override
                  </h3>
                </div>
              </div>
              <p className="text-xs text-[#8E8E93]">
                Directly adjust access tier, grant passes, or record offline payments for{" "}
                <span className="text-white font-bold">
                  {selectedUser.name ? `${selectedUser.name} (${selectedUser.email})` : selectedUser.email}
                </span>.
              </p>
            </div>

            <form onSubmit={handleSubmitOverride} className="space-y-5 text-xs">
              {/* Status Switcher: Free vs Active */}
              <div className="space-y-2">
                <label className="text-white/70 font-semibold block">Subscription Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOverrideStatus("active")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-3 ${
                      overrideStatus === "active"
                        ? "bg-emerald-500/15 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        overrideStatus === "active"
                          ? "border-emerald-400 bg-emerald-400"
                          : "border-white/40"
                      }`}
                    >
                      {overrideStatus === "active" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-black" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white">Active Member</div>
                      <div className="text-[10px] text-white/50">Unlocks all gated films</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverrideStatus("free")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-3 ${
                      overrideStatus === "free"
                        ? "bg-white/15 border-white/40 shadow-sm"
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        overrideStatus === "free"
                          ? "border-white bg-white"
                          : "border-white/40"
                      }`}
                    >
                      {overrideStatus === "free" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-black" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white">Free User</div>
                      <div className="text-[10px] text-white/50">Standard access only</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Expiration Date Section (Visible when active) */}
              {overrideStatus === "active" && (
                <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="text-white/80 font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FF5500]" />
                      <span>Expiration Date</span>
                    </label>
                    <span className="text-[10px] text-white/40">Presets:</span>
                  </div>

                  {/* Preset quick-apply buttons */}
                  <div className="flex flex-wrap gap-1.5 pb-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(1)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/80 font-medium cursor-pointer"
                    >
                      +1 Month
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(3)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/80 font-medium cursor-pointer"
                    >
                      +3 Months
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(6)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/80 font-medium cursor-pointer"
                    >
                      +6 Months
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(12)}
                      className="px-2.5 py-1 rounded-lg bg-[#FF5500]/15 hover:bg-[#FF5500]/25 border border-[#FF5500]/30 text-[10px] text-[#FF5500] font-bold cursor-pointer"
                    >
                      +1 Year
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("lifetime")}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold cursor-pointer"
                    >
                      Lifetime
                    </button>
                  </div>

                  <input
                    type="date"
                    value={overrideDate}
                    onChange={(e) => setOverrideDate(e.target.value)}
                    placeholder="YYYY-MM-DD (Leave empty for Lifetime)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF5500] transition-colors"
                  />
                  <p className="text-[10px] text-white/40">
                    {overrideDate
                      ? `Access will expire on ${overrideDate}`
                      : "No expiration set (Indefinite / Lifetime access)"}
                  </p>
                </div>
              )}

              {/* Reason / Note Field */}
              <div className="space-y-2">
                <label className="text-white/80 font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Audit Reason / Operational Note</span>
                </label>

                {/* Quick note suggestions */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    "Paid via Bakong/KHQR offline",
                    "VIP pass",
                    "Press / Festival Screener",
                    "Student Scholarship",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setOverrideReason(preset)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                        overrideReason === preset
                          ? "bg-[#FF5500] text-white font-bold"
                          : "bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Paid via Bakong/KHQR offline, VIP pass..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF5500] transition-colors"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeOverrideModal}
                  className="px-4 py-2.5 rounded-xl text-white/60 hover:text-white transition-colors text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#EB0029] hover:from-[#ff6a1f] hover:to-[#ff1940] text-white font-bold text-xs shadow-[0_0_20px_rgba(255,85,0,0.35)] transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Applying Override...</span>
                  ) : (
                    <>
                      <span>Save &amp; Apply Override</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
