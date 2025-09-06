import type React from "react"
import { forwardRef } from "react"
import cn from "clsx"

type TextareaBaseProps = {
  error?: string
  fullWidth?: boolean
  label?: string
  helperText?: string
  className?: string
  containerClassName?: string
  labelClassName?: string
}

type TextareaProps = TextareaBaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      error,
      fullWidth = true,
      label,
      helperText,
      className,
      containerClassName,
      labelClassName,
      id,
      rows = 4,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200 text-sm resize-vertical"

    const styles = cn(
      baseStyles,
      error
        ? "border-red-500 focus:border-red-500 focus:ring-red-500 text-red-900 placeholder-red-300"
        : "border-gray-300 focus:border-purple-500 focus:ring-purple-500",
      fullWidth && "w-full",
      "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
      className,
    )

    return (
      <div className={cn("space-y-1", containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className={cn("block text-sm font-medium text-gray-700", error && "text-red-500", labelClassName)}
          >
            {label}
          </label>
        )}
        <textarea ref={ref} id={id} rows={rows} className={styles} {...props} />
        {(error || helperText) && (
          <p className={cn("text-sm", error ? "text-red-500" : "text-gray-500")}>{error || helperText}</p>
        )}
      </div>
    )
  },
)

Textarea.displayName = "Textarea"
