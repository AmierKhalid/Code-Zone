"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getErrorById } from "@/app/actions/errorActions";
import { createSolution, approveSolution } from "@/app/actions/solutionActions";
import { Categories, difficulties, tilteType } from "@/lib/enums";
import { SolutionValidation } from "@/lib/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/shared/Loader";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { ErrorDetail } from "@/app/types";

const ErrorDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const errorId = params.id as string;

  const [error, setError] = useState<ErrorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingSolution, setIsSubmittingSolution] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof SolutionValidation>>({
    resolver: zodResolver(SolutionValidation),
    defaultValues: {
      content: "",
    },
  });

  useEffect(() => {
    fetchErrorDetails();
  }, [errorId]);

  const fetchErrorDetails = async () => {
    setIsLoading(true);
    try {
      const result = await getErrorById(errorId);
      if (result.success && typeof result.error === "object") {
        setError(result.error);
      } else {
        toast.error("Failed to fetch error details");
        router.push("/Errors");
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      toast.error("An unexpected error occurred");
      router.push("/Errors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolutionSubmit = async (
    values: z.infer<typeof SolutionValidation>,
  ) => {
    if (!error) return;

    setIsSubmittingSolution(true);
    try {
      const result = await createSolution(errorId, values);

      if (result.success) {
        const points = result.pointAward?.pointsEarned || 0;
        toast.success(`Solution submitted! Earned ${points} points!`);
        form.reset();

        if (result.pointAward?.titlePromoted) {
          const newTitle = result.pointAward.newTitle.replace(/_/g, " ");
          toast.success(
            `Congratulations! You've been promoted to ${newTitle}!`,
          );
        }

        // Refresh error details
        await fetchErrorDetails();
      } else {
        toast.error(result.error || "Failed to submit solution");
      }
    } catch (error) {
      console.error("Error submitting solution:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmittingSolution(false);
    }
  };

  const handleApproveSolution = async (solutionId: string) => {
    try {
      const result = await approveSolution(solutionId);
      if (result.success) {
        toast.success("Solution approved and marked as solved!");
        await fetchErrorDetails();
      } else {
        toast.error(result.error || "Failed to approve solution");
      }
    } catch (error) {
      console.error("Error approving solution:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const getDifficultyColor = (difficulty: difficulties | null) => {
    switch (difficulty) {
      case "easy":
        return "text-green-600 bg-green-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "hard":
        return "text-orange-600 bg-orange-100";
      case "expert":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getCategoryColor = (category: Categories | null) => {
    switch (category) {
      case "frontend":
        return "text-blue-600 bg-blue-100";
      case "backend":
        return "text-purple-600 bg-purple-100";
      case "problem_solving":
        return "text-green-600 bg-green-100";
      case "ai_ml":
        return "text-pink-600 bg-pink-100";
      case "mobile_dev":
        return "text-indigo-600 bg-indigo-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatTitle = (title: tilteType | null) => {
    if (!title) return "";
    return title.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return "just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!error) {
    return (
      <div className="flex-center min-h-screen">
        <div className="text-center">
          <h2 className="h2-bold text-light-1 mb-2">Error not found</h2>
          <Link href="/Errors">
            <Button className="mt-4">Back to Errors</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasUserSubmittedSolution = error.solutions.some(
    (solution) => solution.author.id === currentUserId,
  );

  return (
    <div className="flex min-h-0 flex-1">
      <div className="common-container">
        <div className="max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/Errors">
              <Button variant="outline" size="sm">
                Back
              </Button>
            </Link>
            <h1 className="h2-bold text-light-1">{error.title}</h1>
            {error.isSolved && (
              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-small-medium">
                Solved
              </span>
            )}
          </div>

          {/* Error Details */}
          <div className="bg-dark-2 border border-dark-4 rounded-xl p-6 mb-6">
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-4">
              {error.author.image ? (
                <Image
                  src={error.author.image}
                  alt={error.author.name || error.author.username || "User"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {(error.author.name ||
                      error.author.username ||
                      "U")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-small-medium text-light-1">
                  {error.author.name || error.author.username || "Anonymous"}
                </p>
                {error.author.title && (
                  <p className="text-tiny text-primary-500">
                    {formatTitle(error.author.title)}
                  </p>
                )}
              </div>
              <div className="ml-auto text-right">
                <p className="text-tiny text-light-4">
                  {formatDate(error.createdAt)}
                </p>
                <p className="text-small-medium text-primary-500">
                  {error.points} points
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {error.difficulty && (
                <span
                  className={`text-tiny px-2 py-1 rounded-full font-medium ${getDifficultyColor(error.difficulty)}`}
                >
                  {error.difficulty.charAt(0).toUpperCase() +
                    error.difficulty.slice(1)}
                </span>
              )}
              {error.category && (
                <span
                  className={`text-tiny px-2 py-1 rounded-full font-medium ${getCategoryColor(error.category)}`}
                >
                  {error.category.replace(/_/g, " ").charAt(0).toUpperCase() +
                    error.category.replace(/_/g, " ").slice(1)}
                </span>
              )}
            </div>

            {/* Description */}
            {error.description && (
              <div className="mb-4">
                <h3 className="text-base-semibold text-light-1 mb-2">
                  Description
                </h3>
                <p className="text-small-regular text-light-2 whitespace-pre-wrap">
                  {error.description}
                </p>
              </div>
            )}

            {/* Code */}
            {error.code && (
              <div className="mb-4">
                <h3 className="text-base-semibold text-light-1 mb-2">Code</h3>
                <pre className="bg-dark-3 p-4 rounded-lg overflow-x-auto">
                  <code className="text-small-regular text-light-2 font-mono">
                    {error.code}
                  </code>
                </pre>
              </div>
            )}
          </div>

          {/* Solutions Section */}
          <div className="mb-6">
            <h2 className="h3-bold text-light-1 mb-4">
              Solutions ({error._count.solutions})
            </h2>

            {error.solutions.length === 0 ? (
              <div className="bg-dark-2 border border-dark-4 rounded-xl p-6 text-center">
                <p className="text-light-3">
                  No solutions yet. Be the first to solve this error!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {error.solutions.map((solution) => (
                  <div
                    key={solution.id}
                    className="bg-dark-2 border border-dark-4 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      {solution.author.image ? (
                        <Image
                          src={solution.author.image}
                          alt={
                            solution.author.name ||
                            solution.author.username ||
                            "User"
                          }
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {(solution.author.name ||
                              solution.author.username ||
                              "U")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-small-medium text-light-1">
                              {solution.author.name ||
                                solution.author.username ||
                                "Anonymous"}
                            </p>
                            {solution.author.title && (
                              <p className="text-tiny text-primary-500">
                                {formatTitle(solution.author.title)}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-tiny text-light-4">
                              {formatDate(solution.createdAt)}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-tiny text-yellow-500">
                                {"\u2b50".repeat(Math.round(solution.rate))}
                              </span>
                              <span className="text-tiny text-primary-500">
                                +{solution.earnedPoints} pts
                              </span>
                              {solution.isApproved && (
                                <span className="text-tiny px-2 py-1 bg-green-100 text-green-600 rounded-full">
                                  Approved
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-small-regular text-light-2 whitespace-pre-wrap">
                          {solution.content}
                        </div>
                        {!error.isSolved &&
                          error.author.id === currentUserId &&
                          !solution.isApproved && (
                            <div className="mt-3">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleApproveSolution(solution.id)
                                }
                                className="shad-button_primary"
                              >
                                Approve Solution
                              </Button>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Solution Form */}
          {!error.isSolved && !hasUserSubmittedSolution && (
            <div className="bg-dark-2 border border-dark-4 rounded-xl p-6">
              <h2 className="h3-bold text-light-1 mb-4">Submit Solution</h2>
              <form
                onSubmit={form.handleSubmit(handleSolutionSubmit)}
                className="space-y-4"
              >
                <div>
                  <label className="shad-form_label block mb-2">
                    Your Solution
                  </label>
                  <Textarea
                    {...form.register("content")}
                    placeholder="Explain your solution clearly. Include code examples if helpful..."
                    rows={6}
                    className="shad-textarea"
                    disabled={isSubmittingSolution}
                  />
                  {form.formState.errors.content && (
                    <p className="text-red-500 text-small mt-1">
                      {form.formState.errors.content.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="shad-button_primary"
                  disabled={isSubmittingSolution}
                >
                  {isSubmittingSolution ? <Loader /> : "Submit Solution"}
                </Button>
              </form>
            </div>
          )}

          {hasUserSubmittedSolution && !error.isSolved && (
            <div className="bg-dark-2 border border-dark-4 rounded-xl p-6 text-center">
              <p className="text-light-3">
                You have already submitted a solution for this error.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDetailPage;
