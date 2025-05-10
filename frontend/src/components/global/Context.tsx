'use client'

// import { getActiveSidebarOption } from '@components/account/dashboard/UnlimitedAccountNavigation'
// import useMatchMedia from '@lib/hooks/useMatchMedia'
import { usePathname } from 'next/navigation'
import {
  ReactElement,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react'
import { getActiveSidebarOption } from '@components/sidebar/navigation'

const LayoutStateContext = createContext<any>({})
const LayoutActionContext = createContext<any>({})

function layoutReducer(state: any, action: any) {
  switch (action.type) {
    // case 'showEmptySearchMessage': {
    //   return { ...state, isVisibleEmptySearchMessage: true }
    // }
    // case 'hideEmptySearchMessage': {
    //   return { ...state, isVisibleEmptySearchMessage: false }
    // }
    // case 'changeScreenSize': {
    //   return {
    //     ...state,
    //     isMediumScreen: action.payload.isMediumScreen,
    //     activeNavigationItem: '',
    //     isVisibleMenu: false,
    //   }
    // }
    // case 'openMenu': {
    //   return { ...state, isVisibleMenu: true }
    // }
    // case 'closeMenu': {
    //   return { ...state, isVisibleMenu: false }
    // }
    // case 'toggleMenu': {
    //   return { ...state, isVisibleMenu: !state.isVisibleMenu }
    // }
    case 'setActiveRole': {
      return {
        ...state,
        activeRole: action.role,
      }
    }
    // case 'toggleActiveNavigationItem': {
    //   const id = action.id === state.activeNavigationItem ? '' : action.id

    //   return {
    //     ...state,
    //     activeNavigationItem: id,
    //   }
    // }
    case 'toggleDashboardSidebar': {
      return { ...state, isSidebarOpen: !state.isSidebarOpen }
    }
    case 'setActiveSidebarOption': {
      return {
        ...state,
        activeSidebarOption: action.id,
      }
    }
    // case 'setRedirectAfterLogin': {
    //   return {
    //     ...state,
    //     redirectAfterLogin: action.redirects,
    //   }
    // }
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
    // showMenu: () => dispatch({ type: 'showMenu' }),
    // hideMenu: () => dispatch({ type: 'hideMenu' }),
    // toggleMenu: () => dispatch({ type: 'toggleMenu' }),
    // showEmptySearchMessage: () => dispatch({ type: 'showEmptySearchMessage' }),
    // hideEmptySearchMessage: () => dispatch({ type: 'hideEmptySearchMessage' }),
    setActiveRole: (role: string) =>
      dispatch({ type: 'setActiveRole', role: role }),
    // toggleActiveNavigationItem: (id: string) =>
    //   dispatch({ type: 'toggleActiveNavigationItem', id: id }),
    // resetActiveNavigationItem: () => {
    //   dispatch({ type: 'setActiveNavigationItem', id: '' })
    //   dispatch({
    //     type: 'setRedirectAfterLogin',
    //     redirects: undefined,
    //   })
    // },
    toggleDashboardSidebar: () => {
      dispatch({ type: 'toggleDashboardSidebar' })
      dispatch({
        type: 'setRedirectAfterLogin',
        redirects: undefined,
      })
    },
    setActiveSidebarOption: (id: string) =>
      dispatch({ type: 'setActiveSidebarOption', id: id }),
    // setRedirectAfterLogin: (redirects: {
    //   message: ReactNode
    //   member: string
    //   nonMember: string
    // }) =>
    //   dispatch({
    //     type: 'setRedirectAfterLogin',
    //     redirects: redirects,
    //   }),
    // resetRedirectAfterLogin: () =>
    //   dispatch({
    //     type: 'setActiveNavigationItem',
    //     redirects: undefined,
    //   }),
  }
}

const LayoutProvider = ({ children }: { children: ReactElement }) => {
  // const comparisonWidgetRef = useRef()
  // const reviewsWidgetRef = useRef()
  const pathname = usePathname()

  const [state, dispatch] = useReducer(layoutReducer, {
    // isVisibleMenu: false,
    // comparisonWidgetRef: comparisonWidgetRef,
    // reviewsWidgetRef: reviewsWidgetRef,
    // isVisibleEmptySearchMessage: false,
    activeRole: '',
    // isMediumScreen: false,
    isSidebarOpen: true,
    // redirectAfterLogin: undefined,
  })

  // const isMediumScreen = useMatchMedia({ query: '(max-width: 1023px)' })

  // useEffect(() => {
  //   dispatch({ type: 'changeScreenSize', payload: { isMediumScreen } })
  // }, [isMediumScreen])

  useEffect(() => {
    // dispatch({ type: 'menuItems', id: '' })

    //TODO: SET ACTIVE SIDEBAR OPTION cuando cambie el path  name
    dispatch({
      type: 'setActiveSidebarOption',
      id: getActiveSidebarOption(pathname, state.activeRole),
    })
  }, [pathname])

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
