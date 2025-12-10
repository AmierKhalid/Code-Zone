"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import * as React from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

export const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="group"
      toastOptions={{
        classNames: {
          toast:
            "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all " +
            "data-[state=open]:animate-in data-[state=closed]:animate-out " +
            "data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full " +
            "sm:data-[state=open]:slide-in-from-bottom-full " +
            "border-slate-200 bg-white text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",

          description: "text-sm opacity-90",

          actionButton:
            "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-transparent px-3 text-sm font-medium transition-colors " +
            "hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 " +
            "dark:border-slate-800 dark:hover:bg-slate-800 dark:focus:ring-slate-300",

          cancelButton:
            "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-transparent px-3 text-sm font-medium transition-colors " +
            "hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 " +
            "dark:border-slate-800 dark:hover:bg-slate-800 dark:focus:ring-slate-300",
        },
      }}
      {...props}
    />
  )
}
