"use client";

import React from "react";
import { Categories, difficulties } from "@/lib/enums";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterValue = Categories | difficulties | "all" | boolean | string | undefined;

interface FilterPanelProps {
  filters: {
    category: Categories | "all" | undefined;
    difficulty: difficulties | "all" | undefined;
    isSolved: boolean | undefined;
    search: string;
  };
  onFilterChange: (key: string, value: FilterValue) => void;
  onClearFilters: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "frontend", label: "Frontend" },
    { value: "backend", label: "Backend" },
    { value: "problem_solving", label: "Problem Solving" },
    { value: "ai_ml", label: "AI/ML" },
    { value: "mobile_dev", label: "Mobile Dev" },
  ];

  const difficultyOptions = [
    { value: "all", label: "All Difficulties" },
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
    { value: "expert", label: "Expert" },
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "unsolved", label: "Unsolved" },
    { value: "solved", label: "Solved" },
  ];

  const hasActiveFilters =
    filters.category ||
    filters.difficulty ||
    filters.isSolved !== undefined ||
    filters.search;

  return (
    <div className="w-full max-w-5xl mb-6">
      <div className="bg-dark-2 rounded-xl p-4 border border-dark-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <Input
              type="text"
              placeholder="Search errors..."
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="shad-input"
            />
          </div>

          {/* Category Filter */}
          <Select
            value={filters.category || "all"}
            onValueChange={(value) =>
              onFilterChange(
                "category",
                value === "all" ? undefined : (value as Categories),
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Difficulty Filter */}
          <Select
            value={filters.difficulty || "all"}
            onValueChange={(value) =>
              onFilterChange(
                "difficulty",
                value === "all" ? undefined : (value as difficulties),
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficultyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={
              filters.isSolved === undefined
                ? "all"
                : filters.isSolved
                  ? "solved"
                  : "unsolved"
            }
            onValueChange={(value) =>
              onFilterChange(
                "isSolved",
                value === "all" ? undefined : value === "solved",
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          <div className="lg:col-span-2 flex items-end">
            <Button
              variant="outline"
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-dark-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-small-medium text-light-4">
                Active filters:
              </span>
              {filters.search !== "" && (
                <span className="text-tiny px-2 py-1 bg-primary-500/20 text-primary-500 rounded-full">
                  Search: "{filters.search}"
                </span>
              )}
              {filters.category && filters.category !== "all" && (
                <span className="text-tiny px-2 py-1 bg-primary-500/20 text-primary-500 rounded-full">
                  Category: {filters.category.replace(/_/g, " ")}
                </span>
              )}
              {filters.difficulty && filters.difficulty !== "all" && (
                <span className="text-tiny px-2 py-1 bg-primary-500/20 text-primary-500 rounded-full">
                  Difficulty: {filters.difficulty}
                </span>
              )}
              {filters.isSolved !== undefined && (
                <span className="text-tiny px-2 py-1 bg-primary-500/20 text-primary-500 rounded-full">
                  Status: {filters.isSolved ? "Solved" : "Unsolved"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;
