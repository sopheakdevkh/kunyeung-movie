"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { MovieData, EXACT_MOVIES } from "@/lib/movies";
import { NavMenuTarget, MovieRoleAccess } from "@/lib/menu-roles";
import {
  enrichMoviesWithMenuRoles,
  saveMovieMenuRule,
} from "@/lib/server-menu-roles";

export async function getAdminMovies(): Promise<MovieData[]> {
  try {
    const movies = await prisma.movie.findMany({
      include: {
        genres: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (movies.length > 0) {
      return enrichMoviesWithMenuRoles(movies as unknown as MovieData[]);
    }
  } catch (error) {
    console.warn("Failed to query movies from database:", error);
  }

  // Never return static mock movies
  return [];
}

export interface AdminOverviewStats {
  totalMovies: number;
  topRatedMovies: number;
  totalGenres: number;
  totalUsers: number;
  vipUsers: number;
  freeUsers: number;
  adminUsers: number;
  activeSubscribers: number;
  totalViews: number;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    avatar?: string | null;
    role: string;
    subscriptionStatus: string;
    subscriptionTier: string | null;
    subscriptionEndDate: string | null;
    createdAt: string;
  }>;
}

export async function getAdminStats(): Promise<AdminOverviewStats> {
  try {
    const [
      movieCount,
      topRatedCount,
      genreCount,
      totalUsersCount,
      vipUsersCount,
      freeUsersCount,
      adminUsersCount,
      recentUsersList,
    ] = await Promise.all([
      prisma.movie.count(),
      prisma.movie.count({ where: { isTopRated: true } }),
      prisma.genre.count(),
      prisma.user.count(),
      prisma.user.count({
        where: {
          subscriptionStatus: "active",
          role: { not: "ADMIN" },
        },
      }),
      prisma.user.count({
        where: {
          subscriptionStatus: "free",
          role: { not: "ADMIN" },
        },
      }),
      prisma.user.count({
        where: {
          role: "ADMIN",
        },
      }),
      prisma.user.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
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
      }),
    ]);

    return {
      totalMovies: movieCount,
      topRatedMovies: topRatedCount,
      totalGenres: genreCount,
      totalUsers: totalUsersCount,
      vipUsers: vipUsersCount,
      freeUsers: freeUsersCount,
      adminUsers: adminUsersCount,
      activeSubscribers: vipUsersCount,
      totalViews: 84900,
      recentUsers: recentUsersList.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        role: u.role,
        subscriptionStatus: u.subscriptionStatus,
        subscriptionTier: u.subscriptionTier,
        subscriptionEndDate: u.subscriptionEndDate ? u.subscriptionEndDate.toISOString() : null,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.warn("Prisma stats fallback:", error);
    return {
      totalMovies: 0,
      topRatedMovies: 0,
      totalGenres: 0,
      totalUsers: 0,
      vipUsers: 0,
      freeUsers: 0,
      adminUsers: 0,
      activeSubscribers: 0,
      totalViews: 84900,
      recentUsers: [],
    };
  }
}

export async function createMovieAction(data: {
  title: string;
  slug?: string;
  director?: string;
  category?: string;
  description: string;
  publicSynopsis?: string;
  premiumBreakdown?: string;
  youtubeVideoId?: string;
  releaseYear: number;
  duration: number;
  rating: number;
  certification: string;
  posterUrl: string;
  bannerUrl?: string;
  videoUrl?: string;
  isTopRated: boolean;
  rank?: number | null;
  genreNames: string[];
  menus?: NavMenuTarget[];
  roleAccess?: MovieRoleAccess;
}) {
  const slug =
    data.slug?.trim() ||
    data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  try {
    // Upsert genres first
    const genreConnect = [];
    for (const name of data.genreNames) {
      const gSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const genre = await prisma.genre.upsert({
        where: { slug: gSlug },
        update: {},
        create: { name, slug: gSlug },
      });
      genreConnect.push({ id: genre.id });
    }

    // If a category slug is provided, ensure it also exists as a genre
    if (data.category) {
      const catSlug = data.category;
      // Map category slugs to display names
      const categoryNames: Record<string, string> = {
        "mindset-growth": "Mindset & Personal Growth",
        "leadership-resilience": "Leadership & Resilience",
        "social-impact": "Social Impact & Society",
        "philosophical-cinema": "Deep Philosophical Cinema",
        "award-shorts": "Award-Winning Short Films",
      };
      const catName =
        categoryNames[catSlug] ||
        catSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const catGenre = await prisma.genre.upsert({
        where: { slug: catSlug },
        update: {},
        create: { name: catName, slug: catSlug },
      });
      if (!genreConnect.some((g) => g.id === catGenre.id)) {
        genreConnect.push({ id: catGenre.id });
      }
    }

    const movie = await prisma.movie.create({
      data: {
        title: data.title,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        description: data.description,
        publicSynopsis: data.publicSynopsis || null,
        premiumBreakdown: data.premiumBreakdown || null,
        youtubeVideoId: data.youtubeVideoId || null,
        releaseYear: Number(data.releaseYear) || 2024,
        duration: Number(data.duration) || 120,
        rating: Number(data.rating) || 8.0,
        certification: data.certification || "PG-13",
        posterUrl: data.posterUrl,
        bannerUrl: data.bannerUrl || data.posterUrl,
        videoUrl:
          data.videoUrl ||
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        isTopRated: Boolean(data.isTopRated),
        rank: data.rank ? Number(data.rank) : null,
        genres: {
          connect: genreConnect,
        },
      },
      include: {
        genres: true,
      },
    });

    if (data.menus || data.roleAccess) {
      const rule = {
        menus: data.menus || ["Movies"],
        roleAccess: data.roleAccess || "public",
      };
      saveMovieMenuRule(movie.title, rule);
      saveMovieMenuRule(movie.id, rule);
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/movies");
    revalidatePath("/admin/menus");

    return { success: true, movie };
  } catch (error: unknown) {
    console.error("Create movie error:", error);
    const message = error instanceof Error ? error.message : "Failed to create movie";
    return { success: false, error: message };
  }
}

export async function updateMovieAction(
  id: string,
  data: {
    title: string;
    director?: string;
    category?: string;
    description: string;
    publicSynopsis?: string;
    premiumBreakdown?: string;
    youtubeVideoId?: string;
    releaseYear: number;
    duration: number;
    rating: number;
    certification: string;
    posterUrl: string;
    bannerUrl?: string;
    videoUrl?: string;
    isTopRated: boolean;
    rank?: number | null;
    genreNames: string[];
    menus?: NavMenuTarget[];
    roleAccess?: MovieRoleAccess;
  }
) {
  try {
    const genreConnect = [];
    for (const name of data.genreNames) {
      const gSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const genre = await prisma.genre.upsert({
        where: { slug: gSlug },
        update: {},
        create: { name, slug: gSlug },
      });
      genreConnect.push({ id: genre.id });
    }

    // If a category slug is provided, ensure it also exists as a genre
    if (data.category) {
      const catSlug = data.category;
      const categoryNames: Record<string, string> = {
        "mindset-growth": "Mindset & Personal Growth",
        "leadership-resilience": "Leadership & Resilience",
        "social-impact": "Social Impact & Society",
        "philosophical-cinema": "Deep Philosophical Cinema",
        "award-shorts": "Award-Winning Short Films",
      };
      const catName =
        categoryNames[catSlug] ||
        catSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const catGenre = await prisma.genre.upsert({
        where: { slug: catSlug },
        update: {},
        create: { name: catName, slug: catSlug },
      });
      if (!genreConnect.some((g) => g.id === catGenre.id)) {
        genreConnect.push({ id: catGenre.id });
      }
    }

    const movie = await prisma.movie.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        publicSynopsis: data.publicSynopsis || null,
        premiumBreakdown: data.premiumBreakdown || null,
        youtubeVideoId: data.youtubeVideoId || null,
        releaseYear: Number(data.releaseYear),
        duration: Number(data.duration),
        rating: Number(data.rating),
        certification: data.certification,
        posterUrl: data.posterUrl,
        bannerUrl: data.bannerUrl,
        videoUrl: data.videoUrl,
        isTopRated: Boolean(data.isTopRated),
        rank: data.rank ? Number(data.rank) : null,
        genres: {
          set: genreConnect,
        },
      },
      include: {
        genres: true,
      },
    });

    if (data.menus || data.roleAccess) {
      const rule = {
        menus: data.menus || ["Movies"],
        roleAccess: data.roleAccess || "public",
      };
      saveMovieMenuRule(movie.title, rule);
      saveMovieMenuRule(id, rule);
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/movies");
    revalidatePath("/admin/menus");

    return { success: true, movie };
  } catch (error: unknown) {
    console.error("Update movie error:", error);
    const message = error instanceof Error ? error.message : "Failed to update movie";
    return { success: false, error: message };
  }
}

export async function deleteMovieAction(id: string) {
  try {
    await prisma.movie.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/movies");

    return { success: true };
  } catch (error: unknown) {
    console.error("Delete movie error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete movie";
    return { success: false, error: message };
  }
}

export async function toggleTopRatedAction(id: string, isTopRated: boolean, rank?: number) {
  try {
    const movie = await prisma.movie.update({
      where: { id },
      data: {
        isTopRated,
        rank: isTopRated ? rank || 1 : null,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/movies");
    revalidatePath("/admin/hero");

    return { success: true, movie };
  } catch (error: unknown) {
    console.error("Toggle top rated error:", error);
    const message = error instanceof Error ? error.message : "Failed to toggle status";
    return { success: false, error: message };
  }
}

/**
 * Fetch all movies currently featured in the Hero Banner
 */
export async function getHeroBannerSlides(): Promise<MovieData[]> {
  try {
    const slides = await prisma.movie.findMany({
      where: { isTopRated: true },
      include: { genres: true },
      orderBy: { rank: "asc" },
    });

    return slides as unknown as MovieData[];
  } catch (error) {
    console.error("Error loading hero banner slides:", error);
    return [];
  }
}

/**
 * Add a movie to the Hero Banner carousel
 */
export async function addToHeroBannerAction(movieId: string) {
  try {
    const currentHero = await prisma.movie.findMany({
      where: { isTopRated: true },
      orderBy: { rank: "desc" },
      take: 1,
    });

    const nextRank = currentHero.length > 0 && currentHero[0].rank ? currentHero[0].rank + 1 : 1;

    const movie = await prisma.movie.update({
      where: { id: movieId },
      data: {
        isTopRated: true,
        rank: nextRank,
      },
      include: { genres: true },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/hero");
    revalidatePath("/admin/movies");

    return { success: true, movie };
  } catch (error: unknown) {
    console.error("Add to hero banner error:", error);
    const message = error instanceof Error ? error.message : "Failed to add to hero banner";
    return { success: false, error: message };
  }
}

/**
 * Remove a movie from the Hero Banner carousel
 */
export async function removeFromHeroBannerAction(movieId: string) {
  try {
    await prisma.movie.update({
      where: { id: movieId },
      data: {
        isTopRated: false,
        rank: null,
      },
    });

    // Re-normalize ranks
    const remaining = await prisma.movie.findMany({
      where: { isTopRated: true },
      orderBy: { rank: "asc" },
    });

    for (let i = 0; i < remaining.length; i++) {
      await prisma.movie.update({
        where: { id: remaining[i].id },
        data: { rank: i + 1 },
      });
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/hero");
    revalidatePath("/admin/movies");

    return { success: true };
  } catch (error: unknown) {
    console.error("Remove from hero banner error:", error);
    const message = error instanceof Error ? error.message : "Failed to remove from hero banner";
    return { success: false, error: message };
  }
}

/**
 * Reorder Hero Banner slides (sets 1-based ranks based on new order of IDs)
 */
export async function reorderHeroBannerAction(orderedIds: string[]) {
  try {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.movie.update({
          where: { id },
          data: { rank: index + 1, isTopRated: true },
        })
      )
    );

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/hero");
    revalidatePath("/admin/movies");

    return { success: true };
  } catch (error: unknown) {
    console.error("Reorder hero banner error:", error);
    const message = error instanceof Error ? error.message : "Failed to reorder hero banner";
    return { success: false, error: message };
  }
}

/**
 * Update details of a hero slide (banner image, trailer video URL, description)
 */
export async function updateHeroSlideAction(
  movieId: string,
  data: {
    bannerUrl?: string;
    videoUrl?: string;
    description?: string;
    rating?: number;
  }
) {
  try {
    const movie = await prisma.movie.update({
      where: { id: movieId },
      data: {
        ...(data.bannerUrl !== undefined ? { bannerUrl: data.bannerUrl } : {}),
        ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.rating !== undefined ? { rating: Number(data.rating) } : {}),
      },
      include: { genres: true },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/hero");
    revalidatePath("/admin/movies");

    return { success: true, movie };
  } catch (error: unknown) {
    console.error("Update hero slide error:", error);
    const message = error instanceof Error ? error.message : "Failed to update hero slide";
    return { success: false, error: message };
  }
}
