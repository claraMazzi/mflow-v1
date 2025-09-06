'use client'

import { usePathname } from 'next/navigation'
import {
  ReactElement,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from 'react'
import { getActiveSidebarOption } from '@components/dashboard/navigation'

const LayoutStateContext = createContext<any>({})
const LayoutActionContext = createContext<any>({})

function layoutReducer(state: any, action: any) {
  switch (action.type) {
    case 'setActiveRole': {
      return {
        ...state,
        activeRole: action.role,
      }
    }
    case 'toggleDashboardSidebar': {
      return { ...state, isSidebarOpen: !state.isSidebarOpen }
    }
    case 'setSidebarState': {
      return { ...state, sidebarState: action.state }
    }
    case 'setActiveSidebarOption': {
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
    throw new Error('useLayoutState must be used within a LayoutProvider')
  }

  return state
}

const useLayoutActions = () => {
  const dispatch = useContext(LayoutActionContext)

  if (dispatch === undefined) {
    throw new Error('useLayoutActions must be used within a LayoutProvider')
  }

  return {
    setActiveRole: (role: string) =>
      dispatch({ type: 'setActiveRole', role: role }),
    toggleDashboardSidebar: () => {
      dispatch({ type: 'toggleDashboardSidebar' })
    },
    setSidebarState: (state: string) => {
      dispatch({ type: 'setSidebarState', state: state })
    },
    setActiveSidebarOption: (id: string) =>
      dispatch({ type: 'setActiveSidebarOption', id: id }),
  }
}

const LayoutProvider = ({ children }: { children: ReactElement }) => {
  const pathname = usePathname()

  const [state, dispatch] = useReducer(layoutReducer, {
    activeRole: 'MODELADOR',
    isSidebarOpen: true,
    sidebarState: 'expanded'
  })

  useEffect(() => {
    //TODO: SET ACTIVE SIDEBAR OPTION cuando cambie el path  name
    dispatch({
      type: 'setActiveSidebarOption',
      id: getActiveSidebarOption(pathname, state.activeRole),
    })
  }, [pathname])

  useEffect(() => {
    const sidebarState = state.isSidebarOpen ? 'expanded' : 'collapsed'
    dispatch({
      type: 'setSidebarState',
      state: sidebarState
    })

  }, [state.isSidebarOpen])
  
  return (
    <LayoutActionContext.Provider value={dispatch}>
      <LayoutStateContext.Provider value={state}>
        {children}
      </LayoutStateContext.Provider>
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
