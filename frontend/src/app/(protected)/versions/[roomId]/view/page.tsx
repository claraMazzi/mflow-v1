"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { ImageInfo } from "#types/conceptual-model";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@components/ui/tabs/tabs";
import { useSession } from "next-auth/react";
import React from "react";
import { toast } from "sonner";
import { Correction, REVISION_TAB_PAGES, RevisionTabKey } from "#types/revision";
import { VersionViewData } from "#types/version-view";
import { getVersionForReadOnlyView } from "@components/dashboard/versions/actions/get-version-view";
import VersionViewBar from "@components/versions/VersionViewBar";
import { ReadOnlyCorrectionBubble } from "@components/versions/ReadOnlyCorrectionBubble";
import { Loader2 } from "lucide-react";

// Import revision read-only components
import {
	RevisionDescripcionDelSistema,
	RevisionDiagramaEstructura,
	RevisionDiagramaDinamicaEntidades,
	RevisionObjetivosEntradasSalidas,
	RevisionAlcance,
	RevisionDetalle,
	RevisionDiagramaFlujo,
} from "@components/revisions/conceptual-model";

export default function Page({
	params,
}: {
	params: Promise<{ roomId: string }>;
}) {
	const { data: session } = useSession();
	const { roomId: versionId } = React.use(params);

	const [currentTab, setCurrentTab] = useState<RevisionTabKey>("descripcion-sistema");
	const [isLoading, setIsLoading] = useState(true);
	const [versionData, setVersionData] = useState<VersionViewData | null>(null);
	const [selectedCorrectionId, setSelectedCorrectionId] = useState<string | null>(null);

	const containerRef = useRef<HTMLDivElement>(null);
	const [imageInfos, setImageInfos] = useState<Map<string, ImageInfo>>(new Map());

	// Get current page number from tab
	const currentPage = REVISION_TAB_PAGES[currentTab];

	// Filter corrections for the current tab
	const correctionsForCurrentTab = useMemo(() => {
		if (!versionData?.revision?.corrections) return [];
		return versionData.revision.corrections.filter(
			(c) => c.location.page === currentPage
		);
	}, [versionData?.revision?.corrections, currentPage]);

	// Load version data
	useEffect(() => {
		async function loadVersion() {
			if (!session?.user) return;

			setIsLoading(true);
			const result = await getVersionForReadOnlyView(versionId);

			if (result.error) {
				toast.error("Error al cargar la versión", {
					description: result.error,
				});
				setIsLoading(false);
				return;
			}

			if (result.data) {
				setVersionData(result.data);

				// Load image infos - convert server format to client format
				const newImageInfos = new Map<string, ImageInfo>();
				result.data.imageInfos?.forEach((serverImg) => {
					if (serverImg.id) {
						newImageInfos.set(serverImg.id, {
							id: serverImg.id,
							sizeInBytes: serverImg.sizeInBytes || 0,
							url: serverImg.url,
							uploadedAt: new Date(serverImg.createdAt),
							originalFilename: serverImg.originalFilename || "image",
						});
					}
				});
				setImageInfos(newImageInfos);
			}

			setIsLoading(false);
		}

		loadVersion();
	}, [versionId, session?.user]);

	// Handle tab change
	const handleCurrentTabChange = (tab: string) => {
		setCurrentTab(tab as RevisionTabKey);
		setSelectedCorrectionId(null);
	};

	// Handle click on container to deselect correction
	const handleContainerClick = () => {
		setSelectedCorrectionId(null);
	};

	// Handle correction selection from sidebar menu
	const handleCorrectionClickFromMenu = useCallback((correctionId: string) => {
		const correction = versionData?.revision?.corrections.find(
			(c) => c._id === correctionId
		);
		if (correction) {
			// Switch to the tab containing this correction
			const tabKeys = Object.keys(REVISION_TAB_PAGES) as RevisionTabKey[];
			const targetTab = tabKeys.find(
				(key) => REVISION_TAB_PAGES[key] === correction.location.page
			);
			if (targetTab && targetTab !== currentTab) {
				setCurrentTab(targetTab);
			}
			// Select the correction after a short delay to allow tab switch
			setTimeout(() => {
				setSelectedCorrectionId(correctionId);
			}, 100);
		}
	}, [versionData?.revision?.corrections, currentTab]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
				<span className="ml-2 text-gray-600">Cargando versión...</span>
			</div>
		);
	}

	if (!versionData) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p className="text-gray-500">No se pudo cargar la versión.</p>
			</div>
		);
	}

	const conceptualModel = versionData.version.conceptualModel;
	const isRevisada = versionData.version.state === "REVISADA";
	const corrections = versionData.revision?.corrections || [];

	return (
		<div className="flex flex-col h-screen overflow-hidden">
			{/* Version View Bar with hamburger menu */}
			<VersionViewBar
				versionId={versionId}
				conceptualModel={conceptualModel}
				versionTitle={versionData.version.title}
				versionState={versionData.version.state}
				projectTitle={versionData.project.title}
				projectId={versionData.project.id}
				ownerName={versionData.project.owner.name}
				corrections={corrections}
				finalReview={versionData.revision?.finalReview}
				verifierName={versionData.revision?.verifier?.name}
				onCorrectionClick={handleCorrectionClickFromMenu}
				canExportAndRequestRevision={versionData.canExportAndRequestRevision}
			/>

			{/* Main content */}
			<div className="flex flex-col flex-1 overflow-hidden">
				<Tabs
					value={currentTab}
					onValueChange={handleCurrentTabChange}
					defaultValue="descripcion-sistema"
					orientation="horizontal"
					className="flex flex-col flex-1 overflow-hidden"
				>
					<TabsList className="h-full max-h-24 flex">
						<TabsTrigger value="descripcion-sistema" className="word-break">
							Descripción del Sistema
						</TabsTrigger>
						<TabsTrigger value="diagrama-estructura">
							Diagrama de Estructura
						</TabsTrigger>
						<TabsTrigger value="diagrama-dinamica-entidades">
							Entidades y Diagramas Dinámica
						</TabsTrigger>
						<TabsTrigger value="objetivos-entradas-salidas">
							Objetivos, Entradas y Salidas
						</TabsTrigger>
						<TabsTrigger value="alcance">Alcance</TabsTrigger>
						<TabsTrigger value="detalle">Nivel de Detalle</TabsTrigger>
						<TabsTrigger value="flujo">Diagrama de Flujo</TabsTrigger>
					</TabsList>

					{/* Tab content wrapper with correction bubbles */}
					<div 
						ref={containerRef}
						className="flex-1 overflow-auto relative"
						onClick={handleContainerClick}
					>
						{/* Correction bubbles - only show for REVISADA state */}
						{isRevisada &&
							correctionsForCurrentTab.map((correction, index) => {
								// Find the global index for display numbering
								const globalIndex = corrections.findIndex(
									(c) => c._id === correction._id
								);
								return (
									<ReadOnlyCorrectionBubble
										key={correction._id || index}
										correction={correction}
										index={globalIndex >= 0 ? globalIndex : index}
										isSelected={selectedCorrectionId === correction._id}
										onSelect={() => setSelectedCorrectionId(correction._id || null)}
										onClose={() => setSelectedCorrectionId(null)}
										containerRef={containerRef}
									/>
								);
							})}

						<TabsContent value="descripcion-sistema" className="p-4">
							<RevisionDescripcionDelSistema
								conceptualModel={conceptualModel}
							/>
						</TabsContent>

						<TabsContent value="diagrama-estructura" className="p-4">
							<RevisionDiagramaEstructura
								conceptualModel={conceptualModel}
								imageInfos={imageInfos}
							/>
						</TabsContent>

						<TabsContent value="diagrama-dinamica-entidades" className="p-4">
							<RevisionDiagramaDinamicaEntidades
								conceptualModel={conceptualModel}
								imageInfos={imageInfos}
							/>
						</TabsContent>

						<TabsContent value="objetivos-entradas-salidas" className="p-4">
							<RevisionObjetivosEntradasSalidas
								conceptualModel={conceptualModel}
							/>
						</TabsContent>

						<TabsContent value="alcance" className="p-4">
							<RevisionAlcance
								conceptualModel={conceptualModel}
							/>
						</TabsContent>

						<TabsContent value="detalle" className="p-4">
							<RevisionDetalle
								conceptualModel={conceptualModel}
							/>
						</TabsContent>

						<TabsContent value="flujo" className="p-4">
							<RevisionDiagramaFlujo
								conceptualModel={conceptualModel}
								imageInfos={imageInfos}
							/>
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</div>
	);
}
