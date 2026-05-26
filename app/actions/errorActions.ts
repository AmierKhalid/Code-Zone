"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { ErrorValidation } from "@/lib/validations";
import {
  Categories as PrismaCategories,
  difficulties as PrismaDifficulties,
} from "@/lib/types"; // Keep Prisma types for server
import { Categories, difficulties } from "@/lib/enums"; // Import custom types for return values
import { convertCategory, convertDifficulty, convertTitle } from "@/lib/typeConversions";
import { z } from "zod";
import type { ErrorReport, Solution, User, tilteType } from "@/lib/generated/prisma/client";
import { ErrorDetail } from "@/app/types";

type ErrorAuthorType = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  title: tilteType | null;
  totalPoints: number | null;
  createdAt?: Date;
};

type SolutionAuthorType = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  title: tilteType | null;
  totalPoints: number | null;
};

type ErrorWithDetails = ErrorReport & {
  author: ErrorAuthorType;
  solutions: Array<Solution & {
    author: SolutionAuthorType;
  }>;
  _count: {
    solutions: number;
  };
};

type CreateErrorInput = z.infer<typeof ErrorValidation>;

async function requireDbUserId() {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" as const };

  const user = await db.user.findUnique({
    where: { accountId: userId },
    select: { id: true },
  });
  if (!user) return { error: "User not found" as const };

  return { dbUserId: user.id };
}

export async function createError(formData: CreateErrorInput) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = ErrorValidation.parse(formData);

    const author = await db.user.findUnique({
      where: { accountId: userId },
      select: { id: true },
    });
    if (!author) {
      return { success: false, error: "User not found" };
    }

    // Calculate base points based on difficulty
    const basePoints = {
      easy: 10,
      medium: 25,
      hard: 50,
      expert: 100,
    }[validatedData.difficulty || "medium"];

    const error = await db.errorReport.create({
      data: {
        authorId: author.id,
        title: validatedData.title,
        description: validatedData.description,
        code: validatedData.code,
        category: validatedData.category,
        difficulty: validatedData.difficulty,
        points: basePoints,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            title: true,
            totalPoints: true,
          },
        },
        solutions: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
                title: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            solutions: true,
          },
        },
      },
    });

    revalidateTag("errors", "max");
    revalidateTag("home-feed", "max");

    return { success: true, error };
  } catch (error) {
    console.error("Error creating error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create error";
    return { success: false, error: message };
  }
}

export async function getErrors(filters?: {
  category?: Categories;
  difficulty?: difficulties;
  isSolved?: boolean;
  authorId?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const errors = await db.errorReport.findMany({
      where: {
        ...(filters?.category && {
          category: filters.category as PrismaCategories,
        }),
        ...(filters?.difficulty && {
          difficulty: filters.difficulty as PrismaDifficulties,
        }),
        ...(filters?.isSolved !== undefined && { isSolved: filters.isSolved }),
        ...(filters?.authorId && { authorId: filters.authorId }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            title: true,
            totalPoints: true,
          },
        },
        solutions: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
                title: true,
                totalPoints: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Only get the latest solution for preview
        },
        _count: {
          select: {
            solutions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(filters?.limit && { take: filters.limit }),
      ...(filters?.offset && { skip: filters.offset }),
    });

    // Convert Prisma types to custom types for client compatibility
    const convertedErrors = errors.map((error: ErrorWithDetails) => ({
      ...error,
      category: convertCategory(error.category),
      difficulty: convertDifficulty(error.difficulty),
      author: {
        ...error.author,
        title: convertTitle(error.author.title),
      },
      solutions: error.solutions.map((solution: Solution & { author: SolutionAuthorType }) => ({
        ...solution,
        author: {
          ...solution.author,
          title: convertTitle(solution.author.title),
        },
      })),
    }));

    return { success: true, errors: convertedErrors };
  } catch (error) {
    console.error("Error fetching errors:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch errors";
    return { success: false, error: message };
  }
}

export async function getErrorById(errorId: string): Promise<
  | { success: true; error: ErrorDetail }
  | { success: false; error: string }
> {
  try {
    const error = await db.errorReport.findUnique({
      where: { id: errorId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            title: true,
            totalPoints: true,
            createdAt: true,
          },
        },
        solutions: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
                title: true,
                totalPoints: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            solutions: true,
          },
        },
      },
    });

    if (!error) {
      return { success: false, error: "Error not found" };
    }

    // Convert Prisma types to custom types for client compatibility
    const convertedError = {
      ...error,
      category: convertCategory(error.category),
      difficulty: convertDifficulty(error.difficulty),
      author: {
        ...error.author,
        title: convertTitle(error.author.title),
      },
      solutions: error.solutions.map((solution: Solution & { author: SolutionAuthorType }) => ({
        ...solution,
        author: {
          ...solution.author,
          title: convertTitle(solution.author.title),
        },
      })),
    };

    return { success: true, error: convertedError };
  } catch (error) {
    console.error("Error fetching error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch error";
    return { success: false, error: message };
  }
}

export async function deleteError(errorId: string) {
  try {
    const authResult = await requireDbUserId();
    if ("error" in authResult) {
      return { success: false as const, error: authResult.error };
    }
    const { dbUserId } = authResult;

    const error = await db.errorReport.findUnique({
      where: { id: errorId },
      select: { id: true, authorId: true, isSolved: true },
    });

    if (!error) {
      return { success: false as const, error: "Error not found" };
    }

    if (error.authorId !== dbUserId) {
      return { success: false as const, error: "Forbidden" };
    }

    if (error.isSolved) {
      return { success: false as const, error: "Cannot delete solved errors" };
    }

    await db.$transaction(async (tx) => {
      const transaction = tx as typeof db;
      await transaction.solution.deleteMany({ where: { errorId } });
      await transaction.errorReport.delete({ where: { id: errorId } });
    });

    revalidateTag("errors", "max");
    revalidateTag("home-feed", "max");

    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete error";
    return { success: false as const, error: message };
  }
}

export async function getErrorStats() {
  try {
    const stats = await db.errorReport.aggregate({
      _count: {
        id: true,
      },
      where: {
        isSolved: false,
      },
    });

    const difficultyStats = await db.errorReport.groupBy({
      by: ["difficulty"],
      _count: {
        id: true,
      },
      where: {
        isSolved: false,
      },
    });

    const categoryStats = await db.errorReport.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
      where: {
        isSolved: false,
      },
    });

    return {
      success: true,
      totalUnsolved: stats._count.id,
      difficultyStats,
      categoryStats,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}
