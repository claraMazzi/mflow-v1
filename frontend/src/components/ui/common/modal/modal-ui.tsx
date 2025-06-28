"use client"

import { type CustomModalView, useUI } from "@components/ui/context"
import { Modal } from "./modal"

export default function ModalUI() {
  const { displayModal, closeModal, modalView } = useUI()

  // Check if modalView is a custom view (not a string from MODAL_VIEW)
  const customView = modalView && typeof modalView !== "string"

  if (!customView) {
    return null
  }

  const view: CustomModalView = modalView

  return (
    <Modal
      isOpen={displayModal}
      closeModal={closeModal}
      id={view.name}
      title={view.title}
      description={view.description}
      size={view.size}
      containerClassName={view.containerClassName}
      showCloseButton={view.showCloseButton}
      closeButtonClass={view.closeButtonClass}
      fullScreenOnMobile={view.fullScreenOnMobile}
    >
      <>{view.content}</>
    </Modal>
  )
}
