"use client";

import { useOngoingRevisions } from "@hooks/use-revisions";
import { Skeleton } from "@components/ui/skeleton";
import { OngoingRevisionsTable } from "./ongoing-revisions-table";
import { Input } from "@components/ui/common/input";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";

const OngoingRevisions = () => {
  const { revisions, isLoading, refreshRevisions } = useOngoingRevisions();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRevisions = useMemo(() => {
    if (!searchQuery.trim()) return revisions;
    const query = searchQuery.toLowerCase();
    return revisions.filter(
      (revision) =>
        revision.project?.name?.toLowerCase().includes(query) ||
        revision.requestingUser?.name?.toLowerCase().includes(query) ||
        revision.projectOwner?.name?.toLowerCase().includes(query)
    );
  }, [revisions, searchQuery]);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex w-full justify-between items-center border-b border-accent-100 py-2">
        <h1 className="text-2xl font-bold">Revisiones en curso</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Busque un proyecto"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <OngoingRevisionsTable
        revisions={filteredRevisions}
        refreshRevisions={refreshRevisions}
      />
    </div>
  );
};

export default OngoingRevisions;
