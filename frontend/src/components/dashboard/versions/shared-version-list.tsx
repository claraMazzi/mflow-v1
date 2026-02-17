"use client";

import React, { ReactNode } from "react";
import ContentCard from "@components/ui/Cards/ContentCard";
import { DashboardPageSkeleton } from "@components/dashboard/dashboard-page-skeleton";
import { useRouter } from "next/navigation";
import type { SharedVersionItem } from "./actions/share-version";

const getSharedVersionDecorators = (version: SharedVersionItem): ReactNode[] => {
	const decorators: ReactNode[] = [
		<div className="font-bold text-xs flex gap-1" key="state">
			Estado:
			<span className="font-normal">{version.state}</span>
		</div>,
		version.parentVersion ? (
			<div className="font-bold text-xs flex gap-1" key="parent">
				Versión Padre:
				<span className="font-normal">{version.parentVersion.title}</span>
			</div>
		) : (
			<div className="font-bold text-xs flex gap-1" key="parent">
				Versión Padre:
				<span className="font-normal">N/A</span>
			</div>
		),
		<div className="font-bold text-xs flex gap-1" key="project">
			Proyecto:
			<span className="font-normal">{version.projectTitle}</span>
		</div>,
	];
	return decorators;
};

interface SharedVersionListProps {
	versions: SharedVersionItem[];
	refreshVersions: () => void;
	isLoading: boolean;
}

export const SharedVersionList = ({
	versions,
	isLoading,
}: SharedVersionListProps) => {
	const router = useRouter();

	if (isLoading) return <DashboardPageSkeleton />;

	return (
		<div>
			{versions && versions.length > 0 ? (
				<div className="w-full grid md:grid-cols-2 lg:grid-cols-3 gap-2">
					{versions.map((version) => (
						<ContentCard
							key={version.id}
							type="version"
							title={version.title}
							decorators={getSharedVersionDecorators(version)}
							action={() => {
								router.push(`/versions/${version.id}/view`);
							}}
						/>
					))}
				</div>
			) : (
				<div className="text-gray-600">
					No tenés versiones compartidas con vos para solo lectura.
				</div>
			)}
		</div>
	);
};
