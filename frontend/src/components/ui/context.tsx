'use client'

import { usePathname } from 'next/navigation'
import React, { FC, ReactNode, useCallback, useEffect, useMemo } from 'react'

type Nullable<T> = T | null

export const NAV_DROPDOWN_VIEW = ['INFO'] as const
export type NavDropdownView = (typeof NAV_DROPDOWN_VIEW)[number]
export const MODAL_VIEW = ['MENU'] as const
export type ModalView = (typeof MODAL_VIEW)[number]

export type CustomView = {
  name: string
  content: ReactNode
}

export type CustomModalView = CustomView & {
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  containerClassName?: string
  closeButtonClass?: string
  showCloseButton?: boolean
  fullScreenOnMobile?: boolean
}

export type NoticeView = {
  type: 'error' | 'info' | 'warning'
  message: ReactNode
}

export interface State {
  displaySidebar: boolean
  displayAlert: boolean
  displayModal: boolean
  displayNavDropdown: boolean
  navDropdownView: Nullable<NavDropdownView | CustomView>
  modalView: Nullable<ModalView | CustomModalView>
  alertView: Nullable<NoticeView>
  toasterBoxes: NoticeView[]
}

const initialState = {
  displaySidebar: false,
  displayAlert: false,
  displayModal: false,
  displayNavDropdown: false,
  navDropdownView: null,
  modalView: null,
  sidebarView: null,
  alertView: null,
  toasterBoxes: [],
}

type Action =
  | {
      type: 'OPEN_ALERT'
      view?: State['alertView']
    }
  | {
      type: 'CLOSE_ALERT'
    }
  | {
      type: 'OPEN_MODAL'
      view?: State['modalView']
    }
  | {
      type: 'CLOSE_MODAL'
    }
  | {
      type: 'SET_MODAL_VIEW'
      view: State['modalView']
    }
  | {
      type: 'SET_ALERT_VIEW'
      view: State['alertView']
    }
  | {
      type: 'ADD_TOASTER_BOX'
      view: NoticeView
    }
  | {
      type: 'RESET'
    }

export const UIContext = React.createContext<State | any>(initialState)

UIContext.displayName = 'UIContext'

function uiReducer(state: State, action: Action) {
  switch (action.type) {
    case 'OPEN_ALERT': {
      return {
        ...state,
        ...(action.view && { alertView: action.view }),
        displaySidebar: false,
        displayModal: false,
        displayNavDropdown: false,
        displayAlert: true,
      }
    }
    case 'CLOSE_ALERT': {
      return {
        ...state,
        displayAlert: false,
      }
    }
    case 'OPEN_MODAL': {
      return {
        ...state,
        ...(action.view && { modalView: action.view }),
        displayModal: true,
        displayNavDropdown: false,
        displayAlert: false,
        displaySidebar: false,
      }
    }
    case 'CLOSE_MODAL': {
      return {
        ...state,
        displayModal: false,
      }
    }
    case 'SET_MODAL_VIEW': {
      return {
        ...state,
        modalView: action.view,
      }
    }
    case 'SET_ALERT_VIEW': {
      return {
        ...state,
        alertView: action.view,
      }
    }
    case 'ADD_TOASTER_BOX': {
      return {
        ...state,
        toasterBoxes: [...(state.toasterBoxes || []), action.view],
      }
    }
    case 'RESET': {
      return initialState
    }
  }
}

export const UIProvider: FC<{ children?: ReactNode }> = ({ ...props }) => {
  const [state, dispatch] = React.useReducer(uiReducer, initialState)
  const pathname = usePathname()

  useEffect(() => {
    dispatch({ type: 'RESET' })
  }, [pathname])

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [dispatch])
  const openAlert = useCallback(
    (view?: State['alertView']) => dispatch({ type: 'OPEN_ALERT', view }),
    [dispatch]
  )
  const closeAlert = useCallback(
    () => dispatch({ type: 'CLOSE_ALERT' }),
    [dispatch]
  )

  const openModal = useCallback(
    (view?: State['modalView']) => dispatch({ type: 'OPEN_MODAL', view }),
    [dispatch]
  )

  const closeModal = useCallback(
    () => dispatch({ type: 'CLOSE_MODAL' }),
    [dispatch]
  )

  const setModalView = useCallback(
    (view: State['modalView']) => dispatch({ type: 'SET_MODAL_VIEW', view }),
    [dispatch]
  )

  const setAlertView = useCallback(
    (view: State['alertView']) => dispatch({ type: 'SET_ALERT_VIEW', view }),
    [dispatch]
  )

  const addToasterBox = useCallback(
    (view: NoticeView) => dispatch({ type: 'ADD_TOASTER_BOX', view }),
    [dispatch]
  )

  const value = useMemo(
    () => ({
      ...state,
      openAlert,
      closeAlert,
      openModal,
      closeModal,
      setModalView,
      setAlertView,
      addToasterBox,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  )

  return <UIContext.Provider value={value} {...props} />
}

export const useUI = () => {
  const context = React.useContext(UIContext)
  if (context === undefined) {
    throw new Error(`useUI must be used within a UIProvider`)
  }
  return context
}

export const ManagedUIContext: FC<{ children?: ReactNode }> = ({
  children,
}) => <UIProvider>{children}</UIProvider>
