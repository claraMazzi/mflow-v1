import { AppSidebar } from "@components/dashboard/sidebar/app-sidebar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen flex-col ">
			<div className="flex flex-1 ">
				<AppSidebar />
				<main className="flex-1 ">
					<div className="max-w-container px-4 py-6 lg:py-9 lg:pl-20 lg:pr-14 bg-gray-0 h-full">
						<div className="max-w-[1240px] bg-gray-0 mx-auto">{children}</div>
					</div>
				</main>
			</div>
		</div>
	);
}
