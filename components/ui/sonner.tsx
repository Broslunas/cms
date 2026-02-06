"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import React from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/80 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl group-[.toaster]:premium-card",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          error: "group-[.toaster]:!text-destructive group-[.toaster]:!border-destructive/20",
          success: "group-[.toaster]:!text-green-600 dark:group-[.toaster]:!text-green-400 group-[.toaster]:!border-green-500/20",
          warning: "group-[.toaster]:!text-amber-600 dark:group-[.toaster]:!text-amber-400 group-[.toaster]:!border-amber-500/20",
          info: "group-[.toaster]:!text-blue-600 dark:group-[.toaster]:!text-blue-400 group-[.toaster]:!border-blue-500/20",
        },
      }}
      richColors={false} // We are implementing custom colors via classNames for better control, or we can use true. 
      // Actually, richColors=true in sonner is very opinionated. 
      // If we want "premium" look consistent with our app, custom classes are better.
      // But let's check if richColors overrides our classes. 
      // I will set richColors={true} but styling is easier if I let sonner handle colors or I control them.
      // Let's try richColors={true} for simplicity as it covers the "advanced" requirement of colored states well. 
      // However, to match "toggle theme" and "premium glass", custom is safer.
      // I'll stick to richColors={true} but apply glass effects.
      // richColors overrides background.
      // So I will set richColors={false} and handle it myself in classes above. 
      // The classes I wrote for error/success will tint the text/border but keep the glass background.
      expand={true}
      closeButton={true}
      position="bottom-right"
      {...props}
    />
  )
}

export { Toaster }
