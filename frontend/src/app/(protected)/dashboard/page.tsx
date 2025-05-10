// import React from "react"
// import { AppSidebar } from "@components/ui/sidebar/app-sidebar"
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "@components/ui/common/breadcrumb"
// import { Separator } from "@components/ui/common/separator"
// import { SidebarInset, SidebarProvider, SidebarTrigger } from "@components/ui/sidebar/sidebar"

// export default function Page() {
//   const [activeMenuItem, setActiveMenuItem] = React.useState<string | null>(null)

//   const handleMenuItemClick = (item: string) => {
//     setActiveMenuItem(item)
//   }

//   return (
//     <SidebarProvider>
//       <AppSidebar onMenuItemClick={handleMenuItemClick} />
//       <SidebarInset>
//         <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
//           <div className="flex items-center gap-2 px-4">
//             {/* <SidebarTrigger className="-ml-1" /> */}
//             <Separator orientation="vertical" className="mr-2 h-4" />
//             <Breadcrumb>
//               <BreadcrumbList>
//                 <BreadcrumbItem>
//                   <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
//                 </BreadcrumbItem>
//                 <BreadcrumbSeparator />
//                 <BreadcrumbItem>
//                   <BreadcrumbPage>{activeMenuItem || "Select an option"}</BreadcrumbPage>
//                 </BreadcrumbItem>
//               </BreadcrumbList>
//             </Breadcrumb>
//           </div>
//         </header>
//         <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
//           {activeMenuItem ? (
//             <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 p-4 md:min-h-min">
//               <h2 className="text-2xl font-bold mb-4">{activeMenuItem}</h2>
//               <p>Content for {activeMenuItem} goes here.</p>
//             </div>
//           ) : (
//             <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 p-4 md:min-h-min">
//               <h2 className="text-2xl font-bold mb-4">Welcome to the Dashboard</h2>
//               <p>Select an option from the sidebar to view content.</p>
//             </div>
//           )}
//         </div>
//       </SidebarInset>
//     </SidebarProvider>
//   )
// }






const Page = () => {
  return (
    <div>
      </div>
  )
}

export default Page