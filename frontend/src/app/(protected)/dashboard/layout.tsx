// import { Sidebar } from '@components/dashboard/Sidebar'
import { AppSidebar } from '@src/components/dashboard/sidebar/app-sidebar'
import { Sidebar } from '@src/components/dashboard/sidebar/sidebar'
import type React from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  return (
    <div className="flex min-h-screen flex-col border border-[--carbonGray-50]">
      <div className="flex flex-1 ">
        {/* <Sidebar /> */}
        <AppSidebar />
        <main className="flex-1 bg-[--blue-50]">
          <div className="max-w-container px-4 py-6 lg:py-9 lg:pl-20 lg:pr-14">
            <div className="max-w-[1240px]">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
