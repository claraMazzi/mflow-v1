"use client"
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation"
import { type ReactElement, createContext, useContext, useEffect, useReducer, useCallback, useMemo } from "react"
import { getActiveSidebarOption } from "@components/dashboard/navigation"

const LayoutStateContext = createContext<any>({})
const LayoutActionContext = createContext<any>({})

// Cookie helpers
const ROLE_COOKIE_NAME = "mflow_active_role"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year in seconds

function setCookie(name: string, value: string, maxAge: number = COOKIE_MAX_AGE) {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  
  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split("=")
    if (cookieName === name) {
      return decodeURIComponent(cookieValue)
    }
  }
  return null
}

function deleteCookie(name: string) {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=; path=/; max-age=0`
  }
}

function layoutReducer(state: any, action: any) {
  switch (action.type) {
    case "setActiveRole": {
      // Only update cookie if role actually changed
      if (state.activeRole !== action.role) {
        setCookie(ROLE_COOKIE_NAME, action.role)
      }
      return {
        ...state,
        activeRole: action.role,
      }
    }
    case "toggleDashboardSidebar": {
      return { ...state, isSidebarOpen: !state.isSidebarOpen }
    }
    case "setSidebarState": {
      return { ...state, sidebarState: action.state }
    }
    case "setActiveSidebarOption": {
      // Avoid unnecessary state updates
      if (state.activeSidebarOption === action.id) {
        return state
      }
      return {
        ...state,
        activeSidebarOption: action.id,
      }
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

const useLayoutState = () => {
  const state = useContext(LayoutStateContext)

  if (state === undefined) {
    throw new Error("useLayoutState must be used within a LayoutProvider")
  }

  return state
}

const useLayoutActions = () => {
  const dispatch = useContext(LayoutActionContext)

  if (dispatch === undefined) {
    throw new Error("useLayoutActions must be used within a LayoutProvider")
  }

  return useMemo(() => ({
    setActiveRole: (role: string) => dispatch({ type: "setActiveRole", role: role }),
    toggleDashboardSidebar: () => {
      dispatch({ type: "toggleDashboardSidebar" })
    },
    setSidebarState: (state: string) => {
      dispatch({ type: "setSidebarState", state: state })
    },
    setActiveSidebarOption: (id: string) => dispatch({ type: "setActiveSidebarOption", id: id }),
    clearStoredRole: () => {
      deleteCookie(ROLE_COOKIE_NAME)
    },
  }), [dispatch])
}

const getInitialActiveRole = () => {
  if (typeof window !== "undefined") {
    // Try cookie first, fallback to localStorage for migration, then default
    const cookieRole = getCookie(ROLE_COOKIE_NAME)
    if (cookieRole) return cookieRole
    
    // Migrate from localStorage if exists
    const localStorageRole = localStorage.getItem("activeRole")
    if (localStorageRole) {
      setCookie(ROLE_COOKIE_NAME, localStorageRole)
      localStorage.removeItem("activeRole") // Clean up old storage
      return localStorageRole
    }
  }
  return "modelador"
}

const LayoutProvider = ({ children }: { children: ReactElement }) => {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const [state, dispatch] = useReducer(layoutReducer, {
    activeRole: getInitialActiveRole(),
    isSidebarOpen: true,
    sidebarState: "expanded",
    activeSidebarOption: "",
  })

  // Handle role management based on session state
  useEffect(() => {
    if (status === "loading") return // Still loading

    if (status === "unauthenticated") {
      // User logged out - clear stored role
      deleteCookie(ROLE_COOKIE_NAME)
      dispatch({ type: "setActiveRole", role: "modelador" })
    } else if (status === "authenticated" && session?.user?.roles) {
      const userRoles = session.user.roles as string[]
      
      // If user only has one role, use that role
      if (userRoles.length === 1) {
        const singleRole = userRoles[0].toLowerCase()
        dispatch({ type: "setActiveRole", role: singleRole })
        return
      }
      
      // User has multiple roles - validate stored role or set default
      const storedRole = getCookie(ROLE_COOKIE_NAME)
      const userHasStoredRole = userRoles.find((role: string) => role.toUpperCase() === storedRole?.toUpperCase())
      
      if (userHasStoredRole && storedRole) {
        // User has the stored role, keep it (normalize to lowercase)
        dispatch({ type: "setActiveRole", role: storedRole.toLowerCase() })
      } else {
        // User doesn't have stored role - use MODELADOR if they have it, otherwise first role
        const hasModelador = userRoles.find((role: string) => role.toUpperCase() === "MODELADOR")
        const defaultRole = hasModelador ? "modelador" : userRoles[0].toLowerCase()
        dispatch({ type: "setActiveRole", role: defaultRole })
      }
    }
  }, [session, status])

  // Update active sidebar option when pathname or role changes
  useEffect(() => {
    const newOption = getActiveSidebarOption(pathname, state.activeRole)
    dispatch({
      type: "setActiveSidebarOption",
      id: newOption,
    })
  }, [pathname, state.activeRole])

  useEffect(() => {
    const sidebarState = state.isSidebarOpen ? "expanded" : "collapsed"
    dispatch({
      type: "setSidebarState",
      state: sidebarState,
    })
  }, [state.isSidebarOpen])

  // Memoize the state value to prevent unnecessary re-renders
  const stateValue = useMemo(() => state, [state])

  return (
    <LayoutActionContext.Provider value={dispatch}>
      <LayoutStateContext.Provider value={stateValue}>{children}</LayoutStateContext.Provider>
    </LayoutActionContext.Provider>
  )
}

const LayoutConsumer = ({
  children,
}: {
  children(arg0: any): ReactElement
}) => {
  const state = useLayoutState()
  const actions = useLayoutActions()

  return children({ ...state, ...actions })
}

export { LayoutConsumer, LayoutProvider, useLayoutActions, useLayoutState }
