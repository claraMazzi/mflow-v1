"use client";

import React, { useState } from "react";
import { ArrowLeft, Menu, X, MessageCircle, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Correction } from "#types/revision";
import { VersionState } from "#types/version-view";
import { cn } from "@lib/utils";
import { Button } from "@components/ui/common/button";
import { useUI } from "../ui/context";
import { exportVersionToExcel } from "@lib/export-version";
import { RequestRevisionForm } from "../dashboard/versions/forms/request-revision-form";
import { VersionEntity } from "@src/types/version";
import { ConceptualModel, ImageInfo } from "#types/conceptual-model";

interface VersionViewBarProps {
	versionTitle: string;
	versionState: VersionState;
	projectTitle: string;
	projectId: string;
	ownerName: string;
	corrections: Correction[];
	finalReview?: string;
	verifierName?: string;
	onCorrectionClick?: (correctionId: string) => void;
	/** Optional: when provided, Export and Request Revision buttons are shown when version is not in edit mode */
	versionId?: string;
	conceptualModel?: ConceptualModel;
	imageInfos?: Map<string, ImageInfo>;
	/** When false, hide Export and Request Revision (e.g. shared reader). Default true when not provided */
	canExportAndRequestRevision?: boolean;
}

const VersionViewBar = ({
	versionTitle,
	versionState,
	projectTitle,
	projectId,
	ownerName,
	corrections,
	finalReview,
	verifierName,
	onCorrectionClick,
	versionId,
	conceptualModel,
	imageInfos,
	canExportAndRequestRevision = true,
}: VersionViewBarProps) => {
	const router = useRouter();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const { openModal, closeModal } = useUI();

	const isVersionEditable = versionState === "EN EDICION";

	const showExportAndRevision =
		canExportAndRequestRevision &&
		!isVersionEditable &&
		versionId &&
		conceptualModel !== undefined;

	const handleExport = async () => {
		if (!conceptualModel) return;
		await exportVersionToExcel({
			conceptualModel,
			title: versionTitle || "version",
			imageInfos: imageInfos || new Map(),
		});
	};

	const handleRequestRevision = () => {
		if (!versionId) return;
		const version: VersionEntity = {
			id: versionId,
			title: versionTitle,
			state: versionState,
			parentVersion: { id: "", title: "N/A" },
		};
		openModal({
			name: "fullscreen-modal",
			title: "Solicitar Revisión",
			size: "md",
			showCloseButton: false,
			content: (
				<RequestRevisionForm
					version={version}
					onSuccess={() => {
						router.refresh();
					}}
					onClose={closeModal}
				/>
			),
		});
	};

	const getStateBadge = (state: VersionState) => {
		switch (state) {
			case "EN EDICION":
				return (
					<span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
						En Edición
					</span>
				);
			case "FINALIZADA":
				return (
					<span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
						Finalizada
					</span>
				);
			case "PENDIENTE DE REVISION":
				return (
					<span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
						Pendiente de Revisión
					</span>
				);
			case "REVISADA":
				return (
					<span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
						Revisada
					</span>
				);
			default:
				return null;
		}
	};

	const hasCorrections = corrections.length > 0;
	const showRevisionInfo = versionState === "REVISADA";

	return (
		<>
			<div className="bg-slate-50 h-16 flex justify-between items-center px-4 border-b border-slate-200">
				<div className="flex items-center w-full justify-between">
					<div className="flex items-center gap-3">
						<ArrowLeft
							className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
							onClick={() =>
							router.push(`/dashboard/projects/${projectId}/versions`)
						}
						/>
						<div className="flex flex-col">
							<div className="flex items-center gap-2">
								<span className="text-sm text-gray-500">Versión:</span>
								<p className="text-lg font-bold text-gray-800">
									{versionTitle}
								</p>
								{getStateBadge(versionState)}
							</div>
							<p className="text-xs text-gray-500">
								Proyecto: {projectTitle} • Dueño: {ownerName}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						{/* Export and Request Revision - when not in edit mode */}
						{showExportAndRevision && (
							<>
								<Button onClick={handleExport}>EXPORTAR</Button>
								<Button onClick={handleRequestRevision} disabled={versionState === "PENDIENTE DE REVISION"}>
									SOLICITAR REVISIÓN
								</Button>
							</>
						)}

						{/* Show corrections counter when REVISADA */}
						{showRevisionInfo && (
							<div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
								<MessageCircle className="h-4 w-4 text-slate-600" />
								<span className="text-sm text-gray-600">Correcciones:</span>
								<span className="font-semibold text-slate-700">
									{corrections.length}
								</span>
							</div>
						)}

						{/* Hamburger menu button - only show if REVISADA and has corrections or final review */}
						{showRevisionInfo && (hasCorrections || finalReview) && (
							<button
								onClick={() => setIsMenuOpen(true)}
								className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
								aria-label="Ver correcciones"
							>
								<Menu className="h-5 w-5 text-gray-600" />
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Slide-out panel for corrections */}
			{isMenuOpen && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 bg-black/30 z-40"
						onClick={() => setIsMenuOpen(false)}
					/>

					{/* Panel */}
					<div className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-xl z-50 animate-in slide-in-from-right duration-300">
						<div className="flex flex-col h-full">
							{/* Panel header */}
							<div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-slate-50">
								<div className="flex items-center gap-2">
									<MessageCircle className="h-5 w-5 text-slate-600" />
									<h2 className="text-lg font-semibold text-gray-800">
										Correcciones de la revisión
									</h2>
								</div>
								<button
									onClick={() => setIsMenuOpen(false)}
									className="p-1 hover:bg-slate-200 rounded transition-colors"
								>
									<X className="h-5 w-5 text-gray-500" />
								</button>
							</div>

							{/* Verifier info */}
							{verifierName && (
								<div className="px-4 py-3 border-b border-gray-100 bg-blue-50">
									<div className="flex items-center gap-2 text-sm text-blue-700">
										<User className="h-4 w-4" />
										<span>Revisado por: <strong>{verifierName}</strong></span>
									</div>
								</div>
							)}

							{/* Panel content */}
							<div className="flex-1 overflow-y-auto">
								{/* Final review section */}
								{finalReview && (
									<div className="p-4 border-b border-gray-100">
										<h3 className="text-sm font-semibold text-gray-700 mb-2">
											Devolución final
										</h3>
										<p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
											{finalReview}
										</p>
									</div>
								)}

								{/* Corrections list */}
								{hasCorrections ? (
									<div className="p-4">
										<h3 className="text-sm font-semibold text-gray-700 mb-3">
											Lista de correcciones ({corrections.length})
										</h3>
										<div className="space-y-3">
											{corrections.map((correction, index) => (
												<button
													key={correction._id || index}
													onClick={() => {
														if (correction._id && onCorrectionClick) {
															onCorrectionClick(correction._id);
															setIsMenuOpen(false);
														}
													}}
													className={cn(
														"w-full text-left p-3 rounded-lg border transition-colors",
														"hover:bg-amber-50 hover:border-amber-300",
														"bg-white border-gray-200"
													)}
												>
													<div className="flex items-start gap-3">
														<div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
															{index + 1}
														</div>
														<div className="flex-1 min-w-0">
															<p className="text-sm text-gray-700 line-clamp-3">
																{correction.description || (
																	<span className="italic text-gray-400">
																		Sin descripción
																	</span>
																)}
															</p>
															<p className="text-xs text-gray-400 mt-1">
																Página {correction.location.page + 1}
															</p>
														</div>
													</div>
												</button>
											))}
										</div>
									</div>
								) : (
									<div className="flex flex-col items-center justify-center p-8 text-center">
										<MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
										<p className="text-sm text-gray-500">
											No hay correcciones registradas
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</>
			)}
		</>
	);
};

export default VersionViewBar;
