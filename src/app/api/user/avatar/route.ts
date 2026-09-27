import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { extractTokenFromRequest, verifyAuthToken } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload image buffer to Cloudinary via REST API (no SDK needed).
 * Uses CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, and NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME env vars.
 */
async function uploadToCloudinary(
  buffer: Buffer,
  publicId: string
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are not configured.");
  }

  // Generate signature for upload
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=avatars&public_id=${publicId}&timestamp=${timestamp}&upload_preset=unsigned_avatars`;

  // For unsigned upload, we don't need a signature — use upload_preset
  // But since we have API secret, use signed upload for security
  const crypto = await import("crypto");
  const signature = crypto
    .createHash("sha1")
    .update(`folder=avatars&overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(buffer)]), "avatar.jpg");
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("public_id", publicId);
  formData.append("folder", "avatars");
  formData.append("overwrite", "true");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Cloudinary upload error:", errBody);
    throw new Error("Failed to upload image to Cloudinary.");
  }

  const data = await res.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

/**
 * Delete image from Cloudinary via REST API.
 */
async function deleteFromCloudinary(publicId: string): Promise<void> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return;

  const timestamp = Math.floor(Date.now() / 1000);
  const crypto = await import("crypto");
  const signature = crypto
    .createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  try {
    await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_id: publicId,
          api_key: apiKey,
          timestamp,
          signature,
        }),
      }
    );
  } catch (err) {
    console.warn("Could not delete old avatar from Cloudinary:", err);
  }
}

/**
 * Extract Cloudinary public_id from a Cloudinary URL.
 * e.g. https://res.cloudinary.com/xxx/image/upload/v123/avatars/avatar-userId.jpg → avatars/avatar-userId
 */
function extractCloudinaryPublicId(url: string): string | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.*?)(?:\.\w+)?$/);
  return match ? match[1] : null;
}

/**
 * POST /api/user/avatar
 * Allows any authenticated user (USER, VIP, ADMIN) to upload or update their profile avatar.
 * Uploads to Cloudinary CDN (works on Vercel and all serverless platforms).
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be signed in to upload an avatar." },
        { status: 401 }
      );
    }

    const payload = await verifyAuthToken(token);
    if (!payload?.sub) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or expired session." },
        { status: 401 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let avatarUrl: string | null = null;

    // 2. Handle multipart/form-data (File Upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = (formData.get("avatar") || formData.get("file")) as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "Bad Request", message: "No image file provided in form data." },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Payload Too Large", message: "Avatar file size cannot exceed 5MB." },
          { status: 413 }
        );
      }

      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Bad Request", message: "Only image files (JPG, PNG, WebP, GIF, SVG) are supported." },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Cloudinary with a unique public_id per user
      const publicId = `avatar-${payload.sub}`;
      const result = await uploadToCloudinary(buffer, publicId);
      avatarUrl = result.url;
    } else if (contentType.includes("application/json")) {
      // 3. Handle JSON with avatarUrl (direct URL)
      const body = await request.json();
      if (!body.avatarUrl || typeof body.avatarUrl !== "string") {
        return NextResponse.json(
          { error: "Bad Request", message: "Invalid avatarUrl provided." },
          { status: 400 }
        );
      }
      avatarUrl = body.avatarUrl.trim();
    } else {
      return NextResponse.json(
        { error: "Unsupported Media Type", message: "Expected multipart/form-data or application/json." },
        { status: 415 }
      );
    }

    if (!avatarUrl) {
      return NextResponse.json(
        { error: "Bad Request", message: "Failed to determine avatar URL." },
        { status: 400 }
      );
    }

    // 4. Save updated avatar in Database
    const updatedUser = await prisma.user.update({
      where: { id: payload.sub },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      avatar: updatedUser.avatar,
      user: updatedUser,
      message: "Profile avatar updated successfully!",
    });
  } catch (error: any) {
    console.error("Avatar upload API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message || "Failed to upload avatar." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/avatar
 * Removes the avatar and resets user profile to default initials.
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove from Cloudinary if it's a Cloudinary URL
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { avatar: true },
    });

    if (user?.avatar) {
      const publicId = extractCloudinaryPublicId(user.avatar);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    // Clear avatar in database
    await prisma.user.update({
      where: { id: payload.sub },
      data: { avatar: null },
    });

    return NextResponse.json({
      success: true,
      avatar: null,
      message: "Avatar removed. Reverted to default initials.",
    });
  } catch (error: any) {
    console.error("Avatar deletion API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to remove avatar." },
      { status: 500 }
    );
  }
}
