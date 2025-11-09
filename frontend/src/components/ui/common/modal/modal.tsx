"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@components/ui/common/dialog/dialog"
import { Button } from "@components/ui/common/button"
import cn from 'clsx'
type ModalProps = {
  id: string
  title?: string
  description?: string
  isOpen: boolean
  closeModal: () => void
  children: ReactNode
  size?: "sm" | "md" | "lg" | "full"
  containerClassName?: string
  closeButtonClass?: string
  showCloseButton?: boolean
  fullScreenOnMobile?: boolean
}

const ModalHead = ({ title }: { title: ModalProps["title"] }) => {
  if (!title) return null

  return (

    <DialogHeader className="sr-only">
      <DialogTitle className="text-left">{title}</DialogTitle>
    </DialogHeader>
  )
}

export const Modal = ({
  id,
  title,
  description,
  isOpen,
  closeModal,
  closeButtonClass,
  children,
  size = "md",
  containerClassName = "max-h-[90vh] overflow-auto",
  showCloseButton = true,
  fullScreenOnMobile = false,
}: ModalProps) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "md:max-w-sm"
      case "md":
        return "md:max-w-xl"
      case "lg":
        return "md:max-w-3xl"
      case "full":
        return "md:max-w-full w-full h-full"
      default:
        return "md:max-w-xl"
    }
  }

  const getContentClasses = () => {
    const baseClasses = "gap-4"
    const sizeClasses = getSizeClasses()
    const mobileClasses = fullScreenOnMobile ? "sm:max-w-full sm:w-full sm:h-full sm:rounded-none" : ""

    return cn(baseClasses, sizeClasses, mobileClasses, containerClassName)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className={getContentClasses()} id={id} showCloseButton={showCloseButton}>
        {/* Custom close button if specified */}
        {closeButtonClass && (
          <button
            onClick={closeModal}
            className={cn(
              "absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
              closeButtonClass,
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}

        <ModalHead title={title} />

        {description && <DialogDescription className="text-left">{description}</DialogDescription>}

        <div className="flex-1">{children}</div>

        {showCloseButton && (
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
