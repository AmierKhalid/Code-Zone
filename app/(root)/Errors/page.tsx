"use client";

import React, { useState, useEffect } from "react";
import { getErrors } from "@/app/actions/errorActions";
import { Categories, difficulties } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRef } from "react";
import ErrorCard from "@/components/shared/errors/ErrorCard";
import FilterPanel from "@/components/shared/errors/FilterPanel";
import Loader from "@/components/shared/Loader";
import { toast } from "sonner";
import Link from "next/link";
import { ErrorReport } from "@/app/types";

type FilterValue = Categories | difficulties | "all" | boolean | string | undefined;

const ErrorsPage = () => {
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "all" as Categories | "all" | undefined,
    difficulty: "all" as difficulties | "all" | undefined,
    isSolved: undefined as boolean | undefined,
    search: "",
  });

  const fetchErrors = async () => {
    setIsLoading(true);
    try {
      const result = await getErrors({
        category: filters.category === "all" ? undefined : filters.category,
        difficulty:
          filters.difficulty === "all" ? undefined : filters.difficulty,
        isSolved: filters.isSolved,
      });

      if (result.success) {
        let filteredErrors = result.errors || [];

        // Apply search filter
        if (filters.search) {
          filteredErrors = filteredErrors.filter(
            (error: ErrorReport) =>
              error.title
                .toLowerCase()
                .includes(filters.search.toLowerCase()) ||
              error.description
                ?.toLowerCase()
                .includes(filters.search.toLowerCase()),
          );
        }

        setErrors(filteredErrors);
      } else {
        toast.error("Failed to fetch errors");
      }
    } catch (error) {
      console.error("Error fetching errors:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, [filters]);

let warnedAboutHunt = false;

  useEffect(() => {
    if (!warnedAboutHunt) {
      warnedAboutHunt = true;
      toast.error(" DANGER: PROCEED AT YOUR OWN RISK", {
        description: "Error Hunting is a highly experimental, unstable feature. It MAY corrupt your account, crash your browser, and delete your data. Are you ABSOLUTELY sure you want to be here?",
        duration: 10000,
        position: "top-center",
        style: {
          background: "red",
          color: "#ffffff",
          fontWeight: "900",
          fontSize: "16px",
          border: "6px solid #8b0000",
          boxShadow: "0 0 40px #ff0000",
          textShadow: "1px 1px 2px #000000",
          padding: "20px"
        }
      });
    }
  }, []);

  const handleFilterChange = (key: string, value: FilterValue) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: "all",
      difficulty: "all",
      isSolved: undefined,
      search: "",
    });
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="common-container">
        <div className="max-w-5xl flex-start gap-3 justify-between w-full">
          <div className="flex-start gap-3">
            <img src="/icons/bug.svg" width={36} height={36} alt="errors" />
            <h2 className="h3-bold md:h2-bold text-left">Error Hunting</h2>
          </div>
          <Link href="/Errors/create">
            <Button className="shad-button_primary">Post Error</Button>
          </Link>
        </div>

        {/* Filters */}
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
        />

        {/* Error List */}
        <div className="w-full max-w-5xl">
          {isLoading ? (
            <div className="flex-center w-full py-12">
              <Loader />
            </div>
          ) : errors.length === 0 ? (
            <div className="flex-center flex-col py-12">
              <img
                src="/icons/empty.svg"
                width={120}
                height={120}
                alt="empty"
              />
              <p className="text-light-4 text-center mt-4">
                No errors found. Be the first to post one!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {errors.map((error) => (
                <ErrorCard key={error.id} error={error} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorsPage;
