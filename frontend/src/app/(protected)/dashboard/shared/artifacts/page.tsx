"use client";

import React from "react";
import { SharedVersionList } from "@components/dashboard/versions/shared-version-list";
import { useSharedVersions } from "@src/hooks/use-versions";

export default function SharedArtifactsPage() {
	const { versions, isLoading, refreshVersions } = useSharedVersions();

	return (
		<div className="w-full flex flex-col gap-4">
			<div className="flex w-full justify-between border-b border-accent-100 py-2">
				<h1 className="text-2xl font-bold">Versiones compartidas conmigo</h1>
			</div>
			<SharedVersionList
				versions={versions}
				isLoading={isLoading}
				refreshVersions={refreshVersions}
			/>
		</div>
	);
}
