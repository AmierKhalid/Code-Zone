"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Categories, difficulties, tilteType } from "@/lib/enums";

interface ErrorCardProps {
  error: {
    id: string;
    title: string;
    description: string | null;
    code: string | null;
    points: number;
    category: Categories | null;
    difficulty: difficulties | null;
    isSolved: boolean;
    createdAt: Date;
    author: {
      id: string;
      username: string | null;
      name: string | null;
      image: string | null;
      title: tilteType | null;
      totalPoints: number | null;
    };
    solutions: Array<{
      id: string;
      author: {
        id: string;
        username: string | null;
        name: string | null;
        image: string | null;
        title: tilteType | null;
      };
    }>;
    _count: {
      solutions: number;
    };
  };
}

const ErrorCard: React.FC<ErrorCardProps> = ({ error }) => {
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

    if (diffInHours < 1) {
      return "just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Link href={`/Errors/${error.id}`}>
      <div className="error-card bg-dark-2 rounded-xl p-4 border border-dark-4 hover:border-primary-500 transition-all cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1">
            {error.author.image ? (
              <Image
                src={error.author.image}
                alt={error.author.name || error.author.username || "User"}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {(error.author.name ||
                    error.author.username ||
                    "U")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-small-medium text-light-1 truncate">
                {error.author.name || error.author.username || "Anonymous"}
              </p>
              {error.author.title && (
                <p className="text-tiny text-primary-500">
                  {formatTitle(error.author.title)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-tiny text-primary-500 font-medium">
              {error.points} pts
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base-semibold text-light-1 mb-2 line-clamp-2">
          {error.title}
        </h3>

        {/* Description */}
        {error.description && (
          <p className="text-small-regular text-light-3 mb-3 line-clamp-2">
            {error.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {error.difficulty && (
            <span
              className={`text-tiny px-2 py-1 rounded-full font-medium ${getDifficultyColor(
                error.difficulty,
              )}`}
            >
              {error.difficulty.charAt(0).toUpperCase() +
                error.difficulty.slice(1)}
            </span>
          )}
          {error.category && (
            <span
              className={`text-tiny px-2 py-1 rounded-full font-medium ${getCategoryColor(
                error.category,
              )}`}
            >
              {error.category.replace(/_/g, " ").charAt(0).toUpperCase() +
                error.category.replace(/_/g, " ").slice(1)}
            </span>
          )}
          {error.isSolved && (
            <span className="text-tiny px-2 py-1 rounded-full font-medium text-green-600 bg-green-100">
              Solved
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-tiny text-light-4">
          <div className="flex items-center gap-3">
            <span>
              {error._count.solutions}{" "}
              {error._count.solutions === 1 ? "solution" : "solutions"}
            </span>
            {error.solutions.length > 0 && (
              <span>
                Latest by{" "}
                {error.solutions[0].author.name ||
                  error.solutions[0].author.username}
              </span>
            )}
          </div>
          <span>
            <span>{formatDate(new Date(error.createdAt))}</span>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ErrorCard;
