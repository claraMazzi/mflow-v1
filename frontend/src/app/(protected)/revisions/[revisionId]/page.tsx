"use client";

import {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
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
import { Correction, RevisionDetails, REVISION_TAB_PAGES, RevisionTabKey } from "#types/revision";
import {
  getRevisionById,
  saveCorrections,
  startRevision,
} from "@components/dashboard/revisions/actions/revision-actions";
import RevisionBar from "@components/revisions/RevisionBar";
import {
  CorrectionBubble,
  AddCorrectionOverlay,
} from "@components/revisions/CorrectionBubble";
import { FloatingAddCorrectionButton } from "@components/revisions/FloatingAddCorrectionButton";
import { Loader2 } from "lucide-react";

// Import new revision-specific components
import {
  RevisionDescripcionDelSistema,
  RevisionDiagramaEstructura,
  RevisionDiagramaDinamicaEntidades,
  RevisionObjetivosEntradasSalidas,
  RevisionAlcance,
  RevisionDetalle,
  RevisionDiagramaFlujo,
} from "@components/revisions/conceptual-model";

// Generate a temporary client-side ID for new corrections
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export default function Page({
  params,
}: {
  params: Promise<{ revisionId: string }>;
}) {
  const { data: session } = useSession();
  const { revisionId } = React.use(params);

  const [currentTab, setCurrentTab] = useState<RevisionTabKey>("descripcion-sistema");
  const [isLoading, setIsLoading] = useState(true);
  const [revision, setRevision] = useState<RevisionDetails | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [originalCorrections, setOriginalCorrections] = useState<Correction[]>([]);
  const [selectedCorrectionId, setSelectedCorrectionId] = useState<string | null>(null);
  const [newCorrectionIds, setNewCorrectionIds] = useState<Set<string>>(new Set());
  const [isAddingCorrection, setIsAddingCorrection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageInfos, setImageInfos] = useState<Map<string, ImageInfo>>(new Map());

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (corrections.length !== originalCorrections.length) return true;
    
    return corrections.some((c, index) => {
      const orig = originalCorrections[index];
      if (!orig) return true;
      return (
        c.description !== orig.description ||
        c.location.x !== orig.location.x ||
        c.location.y !== orig.location.y ||
        c.location.page !== orig.location.page
      );
    });
  }, [corrections, originalCorrections]);

  // Load revision data
  useEffect(() => {
    async function loadRevision() {
      if (!session?.user) return;

      setIsLoading(true);
      const result = await getRevisionById(revisionId);

      if (result.error) {
        toast.error("Error al cargar la revisión", {
          description: result.error,
        });
        setIsLoading(false);
        return;
      }

      if (result.data?.revision) {
        const revisionData = result.data.revision;
        setRevision(revisionData);
        
        // If revision is PENDIENTE, start it
        if (revisionData.state === "PENDIENTE") {
          const startResult = await startRevision(revisionId);
          if (startResult.error) {
            toast.error("Error al iniciar la revisión", {
              description: startResult.error,
            });
          } else {
            // Update local state
            setRevision((prev) =>
              prev ? { ...prev, state: "EN CURSO" } : null
            );
            toast.success("Revisión iniciada", {
              description: "La revisión ha cambiado a estado 'En Curso'.",
            });
          }
        }

        // Load corrections
        const loadedCorrections = revisionData.corrections || [];
        setCorrections(loadedCorrections);
        setOriginalCorrections(loadedCorrections);

        // Load image infos - convert server format to client format
        const newImageInfos = new Map<string, ImageInfo>();
        revisionData.imageInfos?.forEach((serverImg) => {
          if (serverImg.id) {
            newImageInfos.set(serverImg.id, {
              id: serverImg.id,
              sizeInBytes: serverImg.sizeInBytes || 0,
              url: serverImg.url,
              uploadedAt: new Date(serverImg.createdAt),
              filename: serverImg.originalFilename || "image",
            });
          }
        });
        setImageInfos(newImageInfos);
      }

      setIsLoading(false);
    }

    loadRevision();
  }, [revisionId, session?.user]);

  // Get current page number from tab
  const currentPageNumber = useMemo(() => {
    return REVISION_TAB_PAGES[currentTab];
  }, [currentTab]);

  // Filter corrections for current tab/page
  const currentPageCorrections = useMemo(() => {
    return corrections.filter((c) => c.location.page === currentPageNumber);
  }, [corrections, currentPageNumber]);

  // Handle tab change
  const handleCurrentTabChange = (newTab: string) => {
    setCurrentTab(newTab as RevisionTabKey);
    setSelectedCorrectionId(null);
    setIsAddingCorrection(false);
  };

  // Handle correction selection
  const handleSelectCorrection = useCallback((correctionId: string | null) => {
    setSelectedCorrectionId((prev) =>
      prev === correctionId ? null : correctionId
    );
    setIsAddingCorrection(false);
  }, []);

  // Handle save corrections - accepts optional corrections list for immediate saves
  const handleSaveCorrections = useCallback(async (correctionsToUse?: Correction[], showToast = true) => {
    if (!revision) return;

    setIsSaving(true);
    
    const correctionsList = correctionsToUse ?? corrections;
    
    const correctionsPayload = correctionsList.map((c) => ({
      description: c.description,
      location: c.location,
      multimediaFilePath: c.multimediaFilePath,
    }));

    const result = await saveCorrections(revisionId, correctionsPayload);

    if (result.error) {
      toast.error("Error al guardar", {
        description: result.error,
      });
    } else {
      if (showToast) {
        toast.success("Correcciones guardadas", {
          description: "Los cambios han sido guardados exitosamente.",
        });
      }
      if (result.data?.corrections) {
        setCorrections(result.data.corrections);
        setOriginalCorrections(result.data.corrections);
        setNewCorrectionIds(new Set());
      }
    }

    setIsSaving(false);
  }, [revision, corrections, revisionId]);

  // Handle correction update with auto-save
  const handleUpdateCorrection = useCallback((updatedCorrection: Correction) => {
    const newCorrectionsList = corrections.map((c) =>
      c._id === updatedCorrection._id ? updatedCorrection : c
    );
    
    setCorrections(newCorrectionsList);
    
    // Auto-save immediately (silently)
    handleSaveCorrections(newCorrectionsList, false);
  }, [corrections, handleSaveCorrections]);

  // Handle correction delete
  const handleDeleteCorrection = useCallback((correctionId: string) => {
    const newCorrectionsList = corrections.filter((c) => c._id !== correctionId);
    setCorrections(newCorrectionsList);
    setNewCorrectionIds((prev) => {
      const next = new Set(prev);
      next.delete(correctionId);
      return next;
    });
    setSelectedCorrectionId(null);
    
    // Auto-save after delete
    handleSaveCorrections(newCorrectionsList, false);
  }, [corrections, handleSaveCorrections]);

  // Handle closing a correction bubble (deselect)
  const handleCloseCorrection = useCallback(() => {
    setSelectedCorrectionId(null);
  }, []);

  // Handle add new correction (no auto-save, just adds locally)
  const handleAddCorrection = useCallback(
    (newCorrection: Omit<Correction, "_id">) => {
      const correctionWithId: Correction = {
        ...newCorrection,
        _id: generateTempId(),
      };
      
      setCorrections((prev) => [...prev, correctionWithId]);
      setSelectedCorrectionId(correctionWithId._id!);
      setNewCorrectionIds((prev) => new Set(prev).add(correctionWithId._id!));
      setIsAddingCorrection(false);
    },
    []
  );

  // Click outside to deselect
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedCorrectionId(null);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-gray-600">Cargando revisión...</p>
        </div>
      </div>
    );
  }

  if (!revision) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-600">No se encontró la revisión</p>
          <p className="text-sm text-gray-400 mt-2">
            La revisión solicitada no existe o no tiene acceso a ella.
          </p>
        </div>
      </div>
    );
  }

  const conceptualModel = revision.version.conceptualModel;

  return (
    <div
      ref={containerRef}
      className="flex-grow bg-gray-50 relative"
      onClick={handleContainerClick}
    >
      <RevisionBar
        revision={revision}
        corrections={corrections}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSaveCorrections}
      />

      {/* Floating action button for adding corrections */}
      <FloatingAddCorrectionButton
        isAddingCorrection={isAddingCorrection}
        onToggleAddCorrection={() => setIsAddingCorrection(!isAddingCorrection)}
      />

      <div className="relative">
        {/* Add correction overlay */}
        <AddCorrectionOverlay
          isActive={isAddingCorrection}
          currentPage={currentPageNumber}
          containerRef={containerRef}
          onAddCorrection={handleAddCorrection}
          onCancel={() => setIsAddingCorrection(false)}
        />

        {/* Correction bubbles for current page */}
        {currentPageCorrections.map((correction) => {
          const globalIndex = corrections.findIndex(
            (c) => c._id === correction._id
          );
          const isNewCorrection = newCorrectionIds.has(correction._id!);
          return (
            <CorrectionBubble
              key={correction._id}
              correction={correction}
              index={globalIndex}
              isSelected={selectedCorrectionId === correction._id}
              isNew={isNewCorrection}
              onSelect={() => handleSelectCorrection(correction._id!)}
              onUpdate={handleUpdateCorrection}
              onDelete={() => handleDeleteCorrection(correction._id!)}
              onClose={handleCloseCorrection}
              containerRef={containerRef}
              isDragging={isDragging}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
            />
          );
        })}

        <div className="flex flex-col overflow-hidden relative">
          <br />
          <Tabs
            value={currentTab}
            onValueChange={handleCurrentTabChange}
            defaultValue="descripcion-sistema"
            orientation="vertical"
          >
            <TabsList className="h-full flex">
              <TabsTrigger value="descripcion-sistema" className="word-break">
                Descripción del Sistema
                {corrections.filter((c) => c.location.page === 0).length > 0 && (
                  <span className="ml-2 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                    {corrections.filter((c) => c.location.page === 0).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="diagrama-estructura">
                Diagrama de Estructura
                {corrections.filter((c) => c.location.page === 1).length > 0 && (
                  <span className="ml-2 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                    {corrections.filter((c) => c.location.page === 1).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="diagrama-dinamica-entidades">
                Entidades y Diagramas Dinámica
                {corrections.filter((c) => c.location.page === 2).length > 0 && (
                  <span className="ml-2 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                    {corrections.filter((c) => c.location.page === 2).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="objetivos-entradas-salidas">
                Objetivos, Entradas y Salidas
                {corrections.filter((c) => c.location.page === 3).length > 0 && (
                  <span className="ml-2 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                    {corrections.filter((c) => c.location.page === 3).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="alcance">
                Alcance
                {corrections.filter((c) => c.location.page === 4).length > 0 && (
                  <span className="ml-2 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                    {corrections.filter((c) => c.location.page === 4).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="detalle">
                Nivel de Detalle
                {corrections.filter((c) => c.location.page === 5).length > 0 && (
                  <span className="ml-2 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                    {corrections.filter((c) => c.location.page === 5).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="flujo">
                Diagrama de Flujo
                {corrections.filter((c) => c.location.page === 6).length > 0 && (
                  <span className="ml-2 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                    {corrections.filter((c) => c.location.page === 6).length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="descripcion-sistema">
              <RevisionDescripcionDelSistema conceptualModel={conceptualModel} />
            </TabsContent>

            <TabsContent value="diagrama-estructura">
              <RevisionDiagramaEstructura
                conceptualModel={conceptualModel}
                imageInfos={imageInfos}
              />
            </TabsContent>

            <TabsContent value="diagrama-dinamica-entidades">
              <RevisionDiagramaDinamicaEntidades
                conceptualModel={conceptualModel}
                imageInfos={imageInfos}
              />
            </TabsContent>

            <TabsContent value="objetivos-entradas-salidas">
              <RevisionObjetivosEntradasSalidas conceptualModel={conceptualModel} />
            </TabsContent>

            <TabsContent value="alcance">
              <RevisionAlcance conceptualModel={conceptualModel} />
            </TabsContent>

            <TabsContent value="detalle">
              <RevisionDetalle conceptualModel={conceptualModel} />
            </TabsContent>

            <TabsContent value="flujo">
              <RevisionDiagramaFlujo
                conceptualModel={conceptualModel}
                imageInfos={imageInfos}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
