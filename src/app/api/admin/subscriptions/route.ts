import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import prisma from "@/lib/db";

/**
 * GET /api/admin/subscriptions
 * Fetches all registered users, roles, and subscription statuses.
 * Protected: requireRole(['admin'])
 */
export async function GET(request: NextRequest) {
  // 1. Enforce Admin Middleware Guard
  const authCheck = await requireRole(request, ["admin"]);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        subscriptionEndDate: true,
        customerId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      users,
      total: users.length,
      adminUser: authCheck.user.email,
    });
  } catch (error) {
    console.error("Database user query failed in admin subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions from database." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/subscriptions
 * Handles Manual Subscription Overrides performed by an Admin.
 * Protected: requireRole(['admin'])
 */
export async function POST(request: NextRequest) {
  // 1. Enforce Admin Middleware Guard
  const authCheck = await requireRole(request, ["admin"]);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const body = await request.json();
    const {
      userId,
      email,
      subscriptionStatus,
      expirationDate,
      reason = "Manual override by administrator",
      subscriptionTier,
    } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { error: "Validation Error: 'userId' or 'email' is required." },
        { status: 400 }
      );
    }

    if (!subscriptionStatus || !["free", "active", "past_due", "cancelled"].includes(subscriptionStatus)) {
      return NextResponse.json(
        { error: "Validation Error: 'subscriptionStatus' must be 'free', 'active', 'past_due', or 'cancelled'." },
        { status: 400 }
      );
    }

    const calculatedEndDate =
      subscriptionStatus === "active"
        ? expirationDate
          ? new Date(expirationDate)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Default +1 year if active without date
        : null;

    const tierToPersist =
      subscriptionTier ||
      (subscriptionStatus === "active" ? "manual_override" : "free");

    // Try updating user in database
    let updatedUser = null;
    try {
      updatedUser = await prisma.user.update({
        where: userId ? { id: userId } : { email },
        data: {
          subscriptionStatus,
          subscriptionEndDate: calculatedEndDate,
          subscriptionTier: tierToPersist,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          subscriptionStatus: true,
          subscriptionTier: true,
          subscriptionEndDate: true,
          updatedAt: true,
        },
      });
    } catch (dbError) {
      return NextResponse.json(
        { error: "User account not found or could not be updated in database." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully overridden subscription for ${updatedUser.email}. Status is now '${subscriptionStatus}'.`,
      auditNote: reason,
      authorizedBy: authCheck.user.email,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Subscription override error:", error);
    return NextResponse.json(
      { error: "Failed to process manual subscription override." },
      { status: 500 }
    );
  }
}
