"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ErrorValidation } from "@/lib/validations";
import { createError } from "@/app/actions/errorActions";
import { Categories, difficulties } from "@/lib/enums";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Loader from "@/components/shared/Loader";
import { toast } from "sonner";

const CreateError = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  type ErrorFormValues = z.infer<typeof ErrorValidation>;

  const form = useForm<ErrorFormValues>({
    resolver: zodResolver(ErrorValidation),
    defaultValues: {
      title: "",
      description: "",
      code: "",
      category: undefined,
      difficulty: difficulties.MEDIUM,
    },
  });

  const handleSubmit = async (values: ErrorFormValues) => {
    setIsLoading(true);

    try {
      const result = await createError(values);

      if (result.success) {
        toast.success("Error posted successfully!");
        router.push("/Errors");
      } else {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Failed to post error",
        );
      }
    } catch (error) {
      console.error("Error posting:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const categoryOptions = [
    { value: "frontend", label: "Frontend" },
    { value: "backend", label: "Backend" },
    { value: "problem_solving", label: "Problem Solving" },
    { value: "ai_ml", label: "AI/ML" },
    { value: "mobile_dev", label: "Mobile Dev" },
  ];

  const difficultyOptions = [
    { value: "easy", label: "Easy (10 points)" },
    { value: "medium", label: "Medium (25 points)" },
    { value: "hard", label: "Hard (50 points)" },
    { value: "expert", label: "Expert (100 points)" },
  ];

  return (
    <div className="flex min-h-0 flex-1">
      <div className="common-container">
        <div className="max-w-5xl flex-start gap-3 justify-start w-full">
          <img src="/icons/bug.svg" width={36} height={36} alt="error" />
          <h2 className="h3-bold md:h2-bold text-left w-full">Post Error</h2>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-9 w-full max-w-5xl"
          >
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Error Title</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      className="shad-input"
                      placeholder="e.g., React component not rendering"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">
                    Error Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="shad-textarea custom-scrollbar"
                      placeholder="Describe what's happening, when it occurs, and what you've tried..."
                      rows={4}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            {/* Code Snippet */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">
                    Code Snippet (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="shad-textarea custom-scrollbar font-mono"
                      placeholder="// Paste your code here..."
                      rows={8}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            {/* Difficulty */}
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Difficulty</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {difficultyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-4 items-center justify-end mb-10">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="shad-button_primary whitespace-nowrap "
                disabled={isLoading}
              >
                {isLoading && <Loader />}
                {isLoading ? "Posting..." : "Post Error"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateError;
