"use client";

import { Button } from "@components/ui/common/button";
import React, { ReactNode, useState } from "react";
import ContentCard from "@components/ui/Cards/ContentCard";
import { DashboardPageSkeleton } from "@components/dashboard/dashboard-page-skeleton";
import { useRouter } from "next/navigation";
import { useUI } from "@components/ui/context";
import { VersionEntity } from "#types/version";
import { CreateVersionForm } from "./forms/create-version-form";
import { RequestRevisionForm } from "./forms/request-revision-form";
import { ShareVersionForm } from "./forms/share-version-form";
import { DeleteVersionResult } from "@src/hooks/use-versions";
import cn from "clsx";

// Modal content component for delete confirmation
const DeleteVersionModalContent = ({
	version,
	onCancel,
	onConfirm,
	isDeleting,
}: {
	version: VersionEntity;
	onCancel: () => void;
	onConfirm: () => void;
	isDeleting: boolean;
}) => {
	return (
		<div className="flex max-w-md flex-col mx-auto justify-center items-center p-4 space-y-4">
			<p className="text-base text-center">
				<span>¿Está seguro de que desea eliminar la versión </span>
				<span className="font-bold">{version.title}</span>
				<span>?</span>
			</p>

			<div className="flex justify-center space-x-3 mt-3 w-full">
				<Button
					variant="outline"
					size="sm"
					onClick={onCancel}
					disabled={isDeleting}
				>
					Cancelar
				</Button>
				<Button size="sm" onClick={onConfirm} disabled={isDeleting}>
					{isDeleting ? "Eliminando..." : "Eliminar"}
				</Button>
			</div>
		</div>
	);
};

const getVersionDecorators = (version: VersionEntity) => {
	const decorators: ReactNode[] = [];

	decorators.push(
		<div className="font-bold text-xs flex gap-1">
			Estado:
			<span className="font-normal">{version.state}</span>
		</div>,
	);

	if (version.parentVersion) {
		decorators.push(
			<div className="font-bold text-xs flex gap-1">
				Versión Padre:
				<span className="font-normal">{version.parentVersion.title}</span>
			</div>,
		);
	} else {
		decorators.push(
			<div className="font-bold text-xs flex gap-1">
				Versión Padre:
				<span className="font-normal">N/A</span>
			</div>,
		);
	}

	return decorators;
};

interface VersionListProps {
	versions: VersionEntity[];
	refreshVersions: () => void;
	isLoading: boolean;
	projectId: string;
	isOwner: boolean;
	deleteVersion: (versionId: string) => Promise<DeleteVersionResult>;
}

const VersionList = ({
	versions,
	refreshVersions,
	isLoading,
	projectId,
	isOwner,
	deleteVersion,
}: VersionListProps) => {
	const router = useRouter();
	const { openModal, closeModal } = useUI();
	const [isDeleting, setIsDeleting] = useState(false);

	const handleCreateNewVersion = (version?: VersionEntity) => {
		openModal({
			name: "fullscreen-modal",
			title: "Crear nueva versión",
			size: "md",
			showCloseButton: false,
			content: (
				<CreateVersionForm
					existingVersions={versions}
					projectId={projectId}
					defaultParentVersionId={version?.id}
					onSuccess={() => {
						refreshVersions();
					}}
					onClose={closeModal}
				/>
			),
		});
	};

	const handleExportVersion = async (version: VersionEntity) => {
		// Navigate to version page where export functionality is available
		// The version page has access to the conceptual model and can export properly
		router.push(`/versions/${version.id}`);
	};

	const handleRequestVerification = (version: VersionEntity) => {
		openModal({
			name: "fullscreen-modal",
			title: "Solicitar Revisión",
			size: "md",
			showCloseButton: false,
			content: (
				<RequestRevisionForm
					version={version}
					onSuccess={() => {
						refreshVersions();
					}}
					onClose={closeModal}
				/>
			),
		});
	};

	const showErrorModal = (errorMessage: string) => {
		openModal({
			name: "fullscreen-modal",
			title: "Error",
			size: "md",
			showCloseButton: false,
			content: (
				<div className="flex max-w-md flex-col mx-auto justify-center items-center p-4 space-y-4">
					<p className="text-base text-center ">{errorMessage}</p>
					<div className="flex justify-center mt-3 w-full">
						<Button size="sm" onClick={closeModal}>
							Aceptar
						</Button>
					</div>
				</div>
			),
		});
	};

	const handleDeleteVersion = (version: VersionEntity) => {
		// Check if version state allows deletion
		if (version.state !== "EN EDICION") {
			showErrorModal(
				`Sólo se puede eliminar una versión que se encuentra en estado "EN EDICIÓN"`,
			);
			return;
		}

		openModal({
			name: "fullscreen-modal",
			title: "Eliminar versión",
			size: "md",
			showCloseButton: false,
			content: (
				<DeleteVersionModalContent
					version={version}
					onCancel={closeModal}
					onConfirm={async () => {
						setIsDeleting(true);
						const result = await deleteVersion(version.id);
						setIsDeleting(false);

						if (result.success) {
							closeModal();
						} else {
							closeModal();
							// Show error modal with the specific error or generic message
							showErrorModal(
								result.error ||
									"Se ha producido un error, por favor inténtelo de nuevo más tarde.",
							);
						}
					}}
					isDeleting={isDeleting}
				/>
			),
		});
	};

	const handleShareVersion = (v: VersionEntity) => {
		openModal({
			name: "fullscreen-modal",
			title: "Compartir versión (solo lectura)",
			size: "md",
			showCloseButton: false,
			content: <ShareVersionForm version={v} />,
		});
	};

	if (isLoading) return <DashboardPageSkeleton />;

	return (
		<div>
			{versions && versions.length > 0 ? (
				<div className="w-full grid md:grid-cols-2 lg:grid-cols-3 gap-2">
					{versions.map((version) => {
						const canCreateFromVersion =
							version.state === "FINALIZADA" ||
							version.state === "PENDIENTE DE REVISION" ||
							version.state === "REVISADA";

						const canRequestRevision = version.state === "FINALIZADA";

						const canExportVersion = version.state !== "EN EDICION";

						const canDeleteVersion = version.state === "EN EDICION" && isOwner;

						const canShareVersion =
							version.state !== "EN EDICION" && version.state !== "ELIMINADA";

						const popoverOptions = [
							{
								content: (
									<Button
										variant={"optionList"}
										onClick={() => handleCreateNewVersion(version)}
										className={cn({ hidden: !canCreateFromVersion })}
									>
										Crear Nueva Versión
									</Button>
								),
							},
							// {
							// 	content: (
							// 		<Button
							// 			variant={"optionList"}
							// 			onClick={() => handleExportVersion(version)}
							// 			className={cn({ hidden: !canExportVersion })}
							// 		>
							// 			Exportar Versión
							// 		</Button>
							// 	),
							// },
							{
								content: (
									<Button
										variant={"optionList"}
										onClick={() => handleRequestVerification(version)}
										className={cn({ hidden: !canRequestRevision })}
									>
										Solicitar Revisión
									</Button>
								),
							},
							{
								content: (
									<Button
										variant={"optionList"}
										onClick={() => handleShareVersion(version)}
										className={cn({ hidden: !canShareVersion })}
									>
										Compartir
									</Button>
								),
							},
							{
								content: (
									<Button
										variant={"optionList"}
										onClick={() => handleDeleteVersion(version)}
										className={cn({ hidden: !canDeleteVersion })}
									>
										Eliminar Versión
									</Button>
								),
							},
						];

						// Determine the route based on version state
						const isReadOnly =
							version.state === "FINALIZADA" ||
							version.state === "PENDIENTE DE REVISION" ||
							version.state === "REVISADA";

						const versionRoute = isReadOnly
							? `/versions/${version.id}/view`
							: `/versions/${version.id}`;

						return (
							<ContentCard
								key={version.id}
								type="version"
								title={version.title}
								options={popoverOptions}
								decorators={getVersionDecorators(version)}
								action={() => {
									router.push(versionRoute);
								}}
							/>
						);
					})}
				</div>
			) : (
				<div>Todavía no tenes ninguna versión creada</div>
			)}
		</div>
	);
};

export default VersionList;
