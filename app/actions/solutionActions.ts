"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import {
  analyzeSolutionQuality,
  calculateEarnedPoints,
} from "@/lib/errorQuality";
import { awardPoints, calculateNewTitle } from "@/lib/pointsCalculator";
import { SolutionValidation } from "@/lib/validations";
import {
  notifyErrorSolved,
  notifySolutionApproved,
  notifyTitleEarned,
} from "@/lib/notifications";
import { z } from "zod";

type CreateSolutionInput = z.infer<typeof SolutionValidation>;

async function requireDbUserId() {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" as const };

  const user = await db.user.findUnique({
    where: { accountId: userId },
    select: { id: true, totalPoints: true, title: true },
  });
  if (!user) return { error: "User not found" as const };

  return {
    dbUserId: user.id,
    currentPoints: user.totalPoints || 0,
    currentTitle: user.title,
  };
}

export async function createSolution(
  errorId: string,
  formData: CreateSolutionInput,
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = SolutionValidation.parse(formData);

    const authResult = await requireDbUserId();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { dbUserId, currentPoints, currentTitle } = authResult;

    // Check if error exists and is not solved
    const error = await db.errorReport.findUnique({
      where: { id: errorId },
      select: {
        id: true,
        authorId: true,
        isSolved: true,
        points: true,
        difficulty: true,
        code: true,
        description: true,
        title: true,
      },
    });

    if (!error) {
      return { success: false, error: "Error not found" };
    }

    if (error.isSolved) {
      return { success: false, error: "Error already solved" };
    }

    // Check if user already submitted a solution
    const existingSolution = await db.solution.findFirst({
      where: { errorId, authorId: dbUserId },
    });

    if (existingSolution) {
      return {
        success: false,
        error: "You have already submitted a solution for this error",
      };
    }

    // Analyze solution quality
    const qualityAnalysis = analyzeSolutionQuality(
      validatedData.content,
      error.code || undefined,
      error.description || undefined,
    );

    // Calculate earned points
    const earnedPoints = calculateEarnedPoints(
      error.points,
      qualityAnalysis.multiplier,
    );

    // Create solution and update user points in a transaction
    const result = await db.$transaction(async (txClient) => {
      const tx = txClient as typeof db;
      // Create the solution
      const solution = await tx.solution.create({
        data: {
          errorId,
          authorId: dbUserId,
          content: validatedData.content,
          rate: qualityAnalysis.metrics.finalScore,
          earnedPoints,
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
          error: {
            select: {
              id: true,
              title: true,
              authorId: true,
              points: true,
            },
          },
        },
      });

      // Update user points
      const pointAward = awardPoints(
        currentPoints,
        currentTitle || "novice",
        earnedPoints,
      );
      const updatedUser = await tx.user.update({
        where: { id: dbUserId },
        data: {
          totalPoints: pointAward.newTotalPoints,
          title: pointAward.newTitle,
        },
        select: {
          id: true,
          username: true,
          name: true,
          title: true,
          totalPoints: true,
        },
      });

      return { solution, updatedUser, pointAward };
    });

    // Create notification for error author if different user
    if (error.authorId !== dbUserId) {
      await notifyErrorSolved({
        errorId: error.id,
        errorTitle: error.title,
        solverId: dbUserId,
        solverName:
          result.updatedUser.name || result.updatedUser.username || "Anonymous",
        authorId: error.authorId,
        solutionId: result.solution.id,
        points: result.pointAward.pointsEarned,
        rating: qualityAnalysis.metrics.finalScore,
      });
    }

    // Check for title promotion and notify user
    if (result.pointAward.titlePromoted) {
      await notifyTitleEarned(dbUserId, result.pointAward.newTitle);
    }

    revalidateTag("errors", "max");
    revalidateTag("solutions", "max");
    revalidateTag("home-feed", "max");

    return {
      success: true,
      solution: result.solution,
      user: result.updatedUser,
      pointAward: result.pointAward,
      qualityAnalysis,
    };
  } catch (error) {
    console.error("Error creating solution:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create solution";
    return { success: false, error: message };
  }
}

export async function approveSolution(solutionId: string) {
  try {
    const authResult = await requireDbUserId();
    if ("error" in authResult) {
      return { success: false as const, error: authResult.error };
    }
    const { dbUserId } = authResult;

    // Get solution with related error
    const solution = await db.solution.findUnique({
      where: { id: solutionId },
      include: {
        error: {
          select: {
            id: true,
            authorId: true,
            title: true,
            isSolved: true,
            acceptedSolutionId: true,
          },
        },
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            totalPoints: true,
          },
        },
      },
    });

    if (!solution) {
      return { success: false as const, error: "Solution not found" };
    }

    // Check if user is the error author
    if (solution.error.authorId !== dbUserId) {
      return {
        success: false as const,
        error: "Only the error author can approve solutions",
      };
    }

    if (solution.error.isSolved) {
      return { success: false as const, error: "Error already solved" };
    }

    // Approve solution and mark error as solved
    const result = await db.$transaction(async (txClient) => {
      const tx = txClient as typeof db;
      // Mark error as solved and set accepted solution
      const updatedError = await tx.errorReport.update({
        where: { id: solution.errorId },
        data: {
          isSolved: true,
          acceptedSolutionId: solutionId,
        },
        select: {
          id: true,
          title: true,
          isSolved: true,
        },
      });

      // Mark solution as approved
      const updatedSolution = await tx.solution.update({
        where: { id: solutionId },
        data: { isApproved: true },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              title: true,
              totalPoints: true,
            },
          },
        },
      });

      return { updatedError, updatedSolution };
    });

    // Create notification for solution author
    if (solution.author.id !== dbUserId) {
      await notifySolutionApproved({
        errorId: solution.errorId,
        errorTitle: solution.error.title || "Unknown Error",
        solverId: solution.author.id,
        solverName:
          solution.author.name || solution.author.username || "Anonymous",
        authorId: dbUserId,
        solutionId: solutionId,
      });
    }

    revalidateTag("errors", "max");
    revalidateTag("solutions", "max");
    revalidateTag("home-feed", "max");

    return {
      success: true as const,
      error: result.updatedError,
      solution: result.updatedSolution,
    };
  } catch (error) {
    console.error("Error approving solution:", error);
    const message =
      error instanceof Error ? error.message : "Failed to approve solution";
    return { success: false as const, error: message };
  }
}

export async function getSolutionsForError(errorId: string) {
  try {
    const solutions = await db.solution.findMany({
      where: { errorId },
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
    });

    return { success: true, solutions };
  } catch (error) {
    console.error("Error fetching solutions:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch solutions";
    return { success: false, error: message };
  }
}

export async function getUserSolutionStats(userId: string) {
  try {
    const stats = await db.solution.aggregate({
      where: { authorId: userId },
      _sum: {
        earnedPoints: true,
      },
      _count: {
        id: true,
      },
    });

    const averageRating = await db.solution.aggregate({
      where: { authorId: userId },
      _avg: {
        rate: true,
      },
    });

    const approvedCount = await db.solution.count({
      where: {
        authorId: userId,
        isApproved: true,
      },
    });

    return {
      success: true,
      totalSolutions: stats._count.id,
      totalEarnedPoints: stats._sum.earnedPoints || 0,
      averageRating: averageRating._avg.rate || 0,
      approvedSolutions: approvedCount,
    };
  } catch (error) {
    console.error("Error fetching solution stats:", error);
    return { success: false, error: "Failed to fetch solution stats" };
  }
}
