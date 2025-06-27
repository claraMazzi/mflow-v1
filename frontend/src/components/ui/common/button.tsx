import * as React from "react"
import Link from "next/link"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2, Plus } from 'lucide-react'
import cn from 'clsx'

const buttonVariants = cva(
  "flex justify-center items-center gap-2 px-4 py-3 rounded-md shadow-md font-medium transition-colors duration-200 text-sm disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-purple-700 hover:bg-purple-600 text-white disabled:opacity-50",
        outline: "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50",
        secondary: "bg-bordo-600 hover:bg-bordo-500 text-white disabled:opacity-50", 
        tertiary: "bg-green-700 hover:bg-green-600 text-white disabled:opacity-50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      fullWidth: {
        true: "w-full",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      fullWidth: false,
    },
  }
)

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  asChild?: boolean
  className?: string
  showIcon?: boolean
  isLoading?: boolean
  children: React.ReactNode
}

// Create a unified click handler type
type UnifiedClickHandler = (
  event: React.MouseEvent<HTMLElement, MouseEvent>
) => void;
type type = "button" | "submit" | "reset" | undefined
// Props for button element
type ButtonAsButtonProps = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps | 'onClick' | 'type'> & {
    as?: "button"
    href?: never
    onClick?: UnifiedClickHandler
    type?: type
  }

// Props for anchor element  
type ButtonAsAnchorProps = ButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps | 'onClick' | 'href'> & {
    as: "a"
    href: string
    onClick?: UnifiedClickHandler
  }

export type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps

const ButtonContent = ({ showIcon, isLoading, children }: Pick<ButtonBaseProps, 'showIcon' | 'isLoading' | 'children'>) => (
  <>
    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
    {!isLoading && showIcon && <Plus className="h-4 w-4" />}
    {children}
  </>
)

const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    asChild, 
    as,
    href, 
    showIcon,
    isLoading,
    children,
    onClick,
    type = "button",
    ...props 
  }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      onClick?.(e)
    }

    const styles = cn(buttonVariants({ variant, size, fullWidth, className }))

    if (as === "a") {
      // Explicitly omit href from props to prevent duplicate
      const { href: _, ...restProps } = props as ButtonAsAnchorProps
      return (
        <Link 
          className={styles}
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href!}
          onClick={handleClick}
          {...restProps}
        >
          <ButtonContent showIcon={showIcon} isLoading={isLoading}>
            {children}
          </ButtonContent>
        </Link>
      )
    }

    if (asChild) {
      return (
        <Slot
          className={styles}
          ref={ref}
          onClick={handleClick}
          {...props}
        >
          <ButtonContent showIcon={showIcon} isLoading={isLoading}>
            {children}
          </ButtonContent>
        </Slot>
      )
    }

    return (
      <button
        className={styles}
        ref={ref as React.Ref<HTMLButtonElement>}
        onClick={handleClick}
        type={type as type}
        disabled={isLoading || (props as ButtonAsButtonProps).disabled}
        {...(props as Omit<ButtonAsButtonProps, 'type' | 'onClick'>)}
      >
        <ButtonContent showIcon={showIcon} isLoading={isLoading}>
          {children}
        </ButtonContent>
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
