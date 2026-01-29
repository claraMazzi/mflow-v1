import { Skeleton } from "@components/ui/skeleton";

/**
 * Shared loading skeleton for dashboard pages with pulsing animation.
 * Shown until page/content is loaded.
 */
export function DashboardPageSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6" data-testid="dashboard-page-skeleton">
      {/* Page title bar */}
      <div className="flex w-full justify-between border-b border-accent-100 py-2">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Content area: mimic table/cards layout */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48 rounded-md" />
        <div className="rounded-md border">
          <div className="border-b bg-gray-200/80 p-3">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 flex-1 rounded-md" />
              ))}
            </div>
          </div>
          <div className="divide-y p-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
              <div key={row} className="flex gap-4 py-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton
                    key={i}
                    className={`h-4 rounded-md ${i === 2 ? "flex-[2]" : "flex-1"}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
