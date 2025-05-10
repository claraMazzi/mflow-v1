'use client'

// import { LogoutButton } from '@components/auth'
import { useLayoutActions, useLayoutState } from '@components/global/Context'
import cn from 'clsx'
import Link from 'next/link'
import { Fragment } from 'react'
// import { Icon, Transition } from 'ui'
// import { navigation } from './UnlimitedAccountNavigation'
import {navigation} from './navigation'


export function Sidebar() {
  const { isSidebarOpen, activeSidebarOption } = useLayoutState()
  const { toggleDashboardSidebar } = useLayoutActions()

  return (
    <aside
      className={cn(
        'relative hidden border-r border-[--carbonGray-50] bg-white transition-all duration-700 ease-in-out lg:block',
        {
          'w-[20.875rem]': isSidebarOpen,
          'w-[7rem]': !isSidebarOpen,
        }
      )}
    >
      <button
        onClick={toggleDashboardSidebar}
        className="hover:bg-gray-100 absolute -right-4 top-8 rounded-full bg-white p-2 shadow transition-all"
        aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {/* <Icon
          iconName="chevron-up"
          className={cn('transition-all', {
            'rotate-90': !isSidebarOpen,
            '-rotate-90': isSidebarOpen,
          })}
          width={18}
          height={18}
        /> */}
      </button>
      <nav className="flex h-full flex-col justify-between py-6">
        <div className="flex flex-col">
          {/* {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.slug}
              className={cn(
                'text-gray-700 hover:bg-gray-100 flex h-14 items-center gap-3 px-10 py-3 text-sm font-medium transition-colors hover:bg-accent-50 hover:text-primary-default',
                {
                  'bg-primary-default text-white':
                    activeSidebarOption == item.slug,
                }
              )}
            >
              <div className="flex h-5 w-5 items-center justify-center">
                {item.icon}
              </div>
              <Transition
                as={Fragment}
                show={isSidebarOpen}
                enter="transition-all ease-in-out duration-500 delay-[100ms]"
                enterFrom="opacity-0 translate-x-5"
                enterTo="opacity-100 translate-x-0"
              >
                <span className="whitespace-nowrap">{item.name}</span>
              </Transition>
            </Link>
          ))} */}
        </div>
        {/* <LogoutButton
          label={
            <div className="text-gray-700 hover:bg-gray-100 flex w-full gap-3 px-10 py-3 text-sm font-medium transition-colors">
              <Icon iconName="logout" width={14} height={14} />
              <Transition
                as={Fragment}
                show={isSidebarOpen}
                enter="transition-all ease-in-out duration-500 delay-[100ms]"
                enterFrom="opacity-0 translate-x-6"
                enterTo="opacity-100 translate-x-0"
              >
                <span className="whitespace-nowrap">Logout</span>
              </Transition>
            </div>
          }
        /> */}
      </nav>
    </aside>
  )
}
