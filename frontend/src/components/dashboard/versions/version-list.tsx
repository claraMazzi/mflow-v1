"use client";

import { Button } from "@components/ui/common/button";
import React, { ReactNode } from "react";
import ContentCard from "@components/ui/Cards/ContentCard";
import { Skeleton } from "@components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useUI } from "@components/ui/context";
import { VersionEntity } from "#types/version";
import { CreateVersionForm } from "./forms/create-version-form";
import { useSession } from "next-auth/react";
import cn from "clsx";

const getVersionDecorators = (version: VersionEntity) => {
	const decorators: ReactNode[] = [];

	decorators.push(
		<div className="font-bold text-xs flex gap-1">
			Estado:
			<span className="font-normal">{version.state}</span>
		</div>
	);

	if (version.parentVersion) {
		decorators.push(
			<div className="font-bold text-xs flex gap-1">
				Versión Padre:
				<span className="font-normal">{version.parentVersion.title}</span>
			</div>
		);
	} else {
		decorators.push(
			<div className="font-bold text-xs flex gap-1">
				Versión Padre:
				<span className="font-normal">N/A</span>
			</div>
		);
	}

	return decorators;
};

interface VersionListProps {
	versions: VersionEntity[];
	refreshVersions: () => void;
	isLoading: boolean;
	projectId: string;
}

const VersionList = ({
	versions,
	refreshVersions,
	isLoading,
	projectId,
}: VersionListProps) => {
	const router = useRouter();
	const { openModal, closeModal } = useUI();
	const { data: session } = useSession();

	const handleCreateNewVersion = (version: VersionEntity) => {
		openModal({
			name: "fullscreen-modal",
			title: "Crear nueva versión",
			size: "md",
			showCloseButton: false,
			content: (
				<CreateVersionForm
					existingVersions={versions}
					projectId={projectId}
					onSuccess={() => {
						refreshVersions();
					}}
				/>
			),
		});
	};

	const handleFinalizeVersion = (version: VersionEntity) => {
		openModal({
			name: "fullscreen-modal",
			title: "Finalizar Versión",
			size: "md",
			showCloseButton: false,
			content: (
				<div className="flex max-w-md flex-col mx-auto justify-center items-center p-4 space-y-4">
					<p className="text-base text-center flex flex-col items-center gap-2">
						¿Está seguro que desea finalizar la versión{" "}
						<span className="font-bold">{version.title}</span>?
						<span className="font-bold">Esta operación no es reversible.</span>
					</p>
					<div className="flex justify-center space-x-3 mt-3 w-full">
						<Button variant="outline" size="sm" onClick={closeModal}>
							Cancelar
						</Button>
						<Button
							size="sm"
							onClick={async () => {
								// TODO: Implement API call to finalize version
								// Mock implementation
								try {
									if (!session?.auth) {
										console.error("Not authenticated");
										return;
									}
									// Mock: This would be the actual API call
									// const response = await fetch(
									//   `${process.env.NEXT_PUBLIC_API_URL}/api/versions/${version.id}/finalize`,
									//   {
									//     method: "POST",
									//     headers: {
									//       Authorization: `Bearer ${session.auth}`,
									//     },
									//   }
									// );
									console.log("Finalizing version:", version.id);
									closeModal();
									refreshVersions();
								} catch (error) {
									console.error("Error finalizing version:", error);
								}
							}}
						>
							Aceptar
						</Button>
					</div>
				</div>
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
			title: "Solicitar verificación",
			size: "md",
			showCloseButton: false,
			content: (
				<div className="flex max-w-md flex-col mx-auto justify-center items-center p-4 space-y-4">
					<p className="text-base text-center">
						Formulario para solicitar verificación de la versión:{" "}
						<span className="font-bold">{version.title}</span>
					</p>
					<div className="w-full space-y-2">
						<label className="text-sm font-medium">Comentarios (opcional)</label>
						<textarea
							className="w-full p-2 border rounded"
							rows={4}
							placeholder="Ingrese comentarios adicionales..."
						/>
					</div>
					<div className="flex justify-center space-x-3 mt-3 w-full">
						<Button variant="outline" size="sm" onClick={closeModal}>
							Cancelar
						</Button>
						<Button size="sm" onClick={closeModal}>
							Enviar solicitud
						</Button>
					</div>
				</div>
			),
		});
	};

	const handleDeleteVersion = (version: VersionEntity) => {
		openModal({
			name: "fullscreen-modal",
			title: "Eliminar versión",
			size: "md",
			showCloseButton: false,
			content: (
				<div className="flex max-w-md flex-col mx-auto justify-center items-center p-4 space-y-4">
					<p className="text-base text-center flex flex-col items-center gap-2">
						¿Está seguro que desea eliminar la versión{" "}
						<span className="font-bold">{version.title}</span>?
						<span className="font-bold text-red-600">
							Esta operación no es reversible.
						</span>
					</p>
					<div className="w-full space-y-2">
						<label className="text-sm font-medium">Motivo (opcional)</label>
						<textarea
							className="w-full p-2 border rounded"
							rows={4}
							placeholder="Ingrese el motivo de la eliminación..."
						/>
					</div>
					<div className="flex justify-center space-x-3 mt-3 w-full">
						<Button variant="outline" size="sm" onClick={closeModal}>
							Cancelar
						</Button>
						<Button variant="destructive" size="sm" onClick={closeModal}>
							Eliminar
						</Button>
					</div>
				</div>
			),
		});
	};

	if (isLoading) return <Skeleton className="w-full h-96" />;

	return (
		<div>
			{versions && versions.length > 0 ? (
				<div className="w-full grid md:grid-cols-2 lg:grid-cols-3 gap-2">
					{versions.map((version) => {
						const popoverOptions = [
							{
								content: (
									<Button
										variant={"optionList"}
										onClick={() => handleCreateNewVersion(version)}
									>
										Crear Nueva Versión
									</Button>
								),
							},
							{
								content: (
									<Button
										variant={"optionList"}
										onClick={() => handleFinalizeVersion(version)}
										className={cn({
											hidden: version.state !== "EN EDICION",
										})}
									>
										Finalizar Versión
									</Button>
								),
							},
							{
								content: (
									<Button
										variant={"optionList"}
										onClick={() => handleExportVersion(version)}
									>
										Exportar Versión
									</Button>
								),
							},
							{
								content: (
									<Button
										variant={"optionList"}
										onClick={() => handleRequestVerification(version)}
									>
										Solicitar Verificación
									</Button>
								),
							},
							{
								content: (
									<Button
										variant={"optionList"}
										onClick={() => handleDeleteVersion(version)}
									>
										Eliminar Versión
									</Button>
								),
							},
						];

						return (
							<ContentCard
								key={version.id}
								type="version"
								title={version.title}
								options={popoverOptions}
								decorators={getVersionDecorators(version)}
								action={() => {
									router.push(`/versions/${version.id}`);
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

