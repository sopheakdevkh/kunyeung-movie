"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, Lock, Loader2 } from "lucide-react";
import { OnePlusSignSvg } from "@/components/OnePlusLogo";
import AdminSidebar from "./AdminSidebar";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, userState, isLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  // If we are already on the admin login page, bypass guard
  const isLoginPage = pathname === "/admin/login";

  const isUserAdmin = Boolean(
    isAdmin || (user && user.role?.toLowerCase() === "admin")
  );

  useEffect(() => {
    if (isLoginPage) return;

    if (!isLoading && !isUserAdmin) {
      setRedirecting(true);
      const target = `/admin/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(target);
    }
  }, [isLoading, isUserAdmin, isLoginPage, pathname, router]);

  // 1. Direct render for /admin/login (no sidebar, no blocking)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // 2. Loading state while session is being verified
  if (isLoading || redirecting || !isUserAdmin) {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#EB0029]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-5 max-w-sm">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(235,0,41,0.25)]">
              <div className="w-9 h-9">
                <OnePlusSignSvg />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#EB0029] flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-white tracking-tight">
              {redirecting || !isUserAdmin
                ? "Restricted Administrator Area"
                : "Verifying Security Credentials"}
            </h2>
            <p className="text-xs text-white/50 leading-relaxed">
              {redirecting || !isUserAdmin
                ? "Administrator authentication required. Redirecting to security login..."
                : "Validating administrator role and cryptographic tokens..."}
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-[#EB0029] font-mono font-semibold pt-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{redirecting ? "Redirecting to Login..." : "Securing Connection..."}</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. User is confirmed Administrator -> Grant full access to Admin Console
  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col md:flex-row">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        <main className="p-4 sm:p-6 lg:p-10 flex-1">{children}</main>
      </div>
    </div>
  );
}
