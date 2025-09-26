"use client"
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation"
import { type ReactElement, createContext, useContext, useEffect, useReducer } from "react"
import { getActiveSidebarOption } from "@components/dashboard/navigation"

const LayoutStateContext = createContext<any>({})
const LayoutActionContext = createContext<any>({})

function layoutReducer(state: any, action: any) {
  switch (action.type) {
    case "setActiveRole": {
      if (typeof window !== "undefined") {
        localStorage.setItem("activeRole", action.role)
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

  return {
    setActiveRole: (role: string) => dispatch({ type: "setActiveRole", role: role }),
    toggleDashboardSidebar: () => {
      dispatch({ type: "toggleDashboardSidebar" })
    },
    setSidebarState: (state: string) => {
      dispatch({ type: "setSidebarState", state: state })
    },
    setActiveSidebarOption: (id: string) => dispatch({ type: "setActiveSidebarOption", id: id }),
    clearStoredRole: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("activeRole")
      }
    },
  }
}

const getInitialActiveRole = () => {
  if (typeof window !== "undefined") {
    const storedRole = localStorage.getItem("activeRole")
    return storedRole || "MODELADOR"
  }
  return "MODELADOR"
}

const LayoutProvider = ({ children }: { children: ReactElement }) => {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const [state, dispatch] = useReducer(layoutReducer, {
    activeRole: getInitialActiveRole(),
    isSidebarOpen: true,
    sidebarState: "expanded",
  })

  // Handle role management based on session state
  useEffect(() => {
    if (status === "loading") return // Still loading

    if (status === "unauthenticated") {
      // User logged out - clear stored role
      if (typeof window !== "undefined") {
        localStorage.removeItem("activeRole")
      }
      dispatch({ type: "setActiveRole", role: "MODELADOR" })
    } else if (status === "authenticated" && session?.user?.roles) {
      // User logged in - validate stored role or set to MODELADOR
      const storedRole = localStorage.getItem("activeRole")
      const userHasStoredRole = session.user.roles.find((role: string) => role.toUpperCase() === storedRole?.toUpperCase())
      
      if (userHasStoredRole) {
        // User has the stored role, keep it
        dispatch({ type: "setActiveRole", role: storedRole })
      } else {
        // User doesn't have stored role or no stored role, set to MODELADOR
        localStorage.setItem("activeRole", "MODELADOR")
        dispatch({ type: "setActiveRole", role: "MODELADOR" })
      }
    }
  }, [session, status])

  useEffect(() => {
    dispatch({
      type: "setActiveSidebarOption",
      id: getActiveSidebarOption(pathname, state.activeRole),
    })
  }, [pathname, state.activeRole])

  useEffect(() => {
    const sidebarState = state.isSidebarOpen ? "expanded" : "collapsed"
    dispatch({
      type: "setSidebarState",
      state: sidebarState,
    })
  }, [state.isSidebarOpen])

  return (
    <LayoutActionContext.Provider value={dispatch}>
      <LayoutStateContext.Provider value={state}>{children}</LayoutStateContext.Provider>
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
