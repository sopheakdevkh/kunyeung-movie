import React from "react";
import prisma from "@/lib/db";
import SubscriptionManagerClient, { AdminUserRecord } from "@/components/admin/SubscriptionManagerClient";
import { Users, Shield, Sparkles } from "lucide-react";

export const metadata = {
  title: "Admin Subscriptions & User Management | LensImpact",
};

export default async function AdminSubscriptionsPage() {
  let initialUsers: AdminUserRecord[] = [];

  try {
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        subscriptionEndDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    initialUsers = dbUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      role: u.role,
      subscriptionStatus: u.subscriptionStatus,
      subscriptionTier: u.subscriptionTier,
      subscriptionEndDate: u.subscriptionEndDate ? u.subscriptionEndDate.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
    }));
  } catch (error) {
    console.warn("Failed to prefetch users from DB:", error);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#FF5500]/15 border border-[#FF5500]/30 text-[#FF5500] text-[10px] font-extrabold uppercase tracking-wider mb-2">
            <Shield className="w-3 h-3" />
            <span>Membership Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            User &amp; Subscription Management
          </h1>
          <p className="text-xs text-[#8E8E93] mt-1 max-w-xl">
            Audit registered users, monitor active subscribers, and apply manual subscription overrides
            for offline payments (Bakong / KHQR), VIP passes, or scholarships.
          </p>
        </div>
      </div>

      <SubscriptionManagerClient initialUsers={initialUsers} />
    </div>
  );
}
