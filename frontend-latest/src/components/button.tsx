import type React from "react"
import { forwardRef } from "react"
import cn from "clsx"
import { Plus } from "lucide-react"
import Link from "next/link"

type ButtonBaseProps = {
  variant?: "primary" | "outline" | "secondary" | "tertiary"
  showIcon?: boolean
  fullWidth?: boolean
  isLoading?: boolean
  children: React.ReactNode
  className?: string
}

// Props for button element
type ButtonAsButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: "button"
    href?: never
  }

// Props for anchor element
type ButtonAsAnchorProps = ButtonBaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: "a"
    href: string
  }

// Combined props type
type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      showIcon = false,
      fullWidth = true,
      isLoading = false,
      className,
      as = "button",
      ...props
    },
    ref,
  ) => {
    const baseStyles = "flex justify-center px-4 py-3 rounded-md shadow-md font-medium transition-colors duration-200 text-sm"

    const variants = {
      primary: "bg-purple-700 hover:bg-purple-600 text-white disabled:opacity-50",
      outline: "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50",
      secondary: "bg-bordo-600 hover:bg-bordo-500 text-white disabled:opacity-50",
      tertiary: "bg-green-700 hover:bg-green-600 text-white disabled:opacity-50",
    }

    const styles = cn(baseStyles, variants[variant], fullWidth && "w-full", "disabled:cursor-not-allowed", className)

    const content = (
      <span className="flex items-center justify-center gap-2">
        {showIcon && <Plus className="w-5 h-5" />}
        {isLoading ? "Cargando..." : children}
      </span>
    )

    if (as === "a") {
      const { href, ...anchorProps } = props as ButtonAsAnchorProps

      return (
        <Link href={href} className={styles} ref={ref as React.Ref<HTMLAnchorElement>} {...anchorProps}>
          {content}
        </Link>
      )
    }

    return (
      <button
        className={styles}
        disabled={isLoading || (props as ButtonAsButtonProps).disabled}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...(props as ButtonAsButtonProps)}
      >
        {content}
      </button>
    )
  },
)

Button.displayName = "Button"

