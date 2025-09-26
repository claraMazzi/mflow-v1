import * as React from "react"
import cn from "clsx"
import type { JSX } from "react" // Import JSX to declare it

// Simple version for debugging
export type StaticColor = "white" | "black" | "yellow" | "blue" | "light-blue" | "bordo" | "green" | "light-green" | "gray" | "white-gray" | "white-black"

interface SimpleBadgeProps {
  className?: string
  size?: "sm" | "md" | "lg"
  color: StaticColor
  children: React.ReactNode
  as?: keyof JSX.IntrinsicElements
}

const getColorClasses = (color: StaticColor) => {
  const colorMap = {
    white: "bg-white text-black",
    black: "bg-black text-white",
    yellow: "bg-yellow-500 text-white",
    blue: "bg-blue-500/50 border-blue-500 border-2 text-blue-500",
    green: "bg-green-500 text-white",
    gray: "bg-gray-700 text-white",
    bordo: "bg-bordo-100 !text-bordo-500 border border-bordo-500 hover:bg-bordo-200",
    'light-blue': "bg-blue-100 !text-blue-500 border border-blue-500 hover:bg-blue-200",
    'light-green':"bg-green-100 !text-green-800 border border-green-500 hover:bg-green-200",
    "white-gray": "bg-white text-gray-600 border border-gray-400",
    "white-black": "bg-white text-black border border-gray-300",
  }
  return colorMap[color] || colorMap.black
}

const getSizeClasses = (size: "sm" | "md" | "lg" = "sm") => {
  const sizeMap = {
    sm: "text-2xs",
    md: "text-xs",
    lg: "text-sm",
  }
  return sizeMap[size]
}

export const Badge = React.forwardRef<HTMLElement, SimpleBadgeProps>(
  ({ className, size = "sm", color, children, as = "div", ...props }, ref) => {
    const baseClasses =
      "rounded-2xl text-xs font-medium leading-4 text-center flex flex-row justify-center items-center h-fit max-w-fit px-2 py-1"
    const colorClasses = getColorClasses(color)
    const sizeClasses = getSizeClasses(size)

    const styles = cn(baseClasses, colorClasses, sizeClasses, className)

    const Component = as as keyof JSX.IntrinsicElements

    return React.createElement(
      Component,
      {
        className: styles,
        ref,
        ...props,
      },
      children,
    )
  },
)

Badge.displayName = "SimpleBadge"
