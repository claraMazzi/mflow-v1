"use client";

import {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { ConceptualModel, ImageInfo } from "#types/conceptual-model";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/tabs/tabs";
import { useSession } from "next-auth/react";
import DescripcionDelSistema from "@components/conceptual-model/DescripcionDelSistema";
import React from "react";
import DiagramaEstructura from "@components/conceptual-model/DiagramaEstructura";
import DiagramaDinamicaEntidades from "@components/conceptual-model/DiagramaDinamicaEntidades";
import ObjetivosEntradasSalidas from "@components/conceptual-model/ObjetivosEntradasSalidas";
import Alcance from "@components/conceptual-model/Alcance";
import Detalle from "@components/conceptual-model/Detalle";
import DiagramaFlujo from "@components/conceptual-model/DiagramaDeFlujo";
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
import { Loader2 } from "lucide-react";

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
  const [newCorrectionIds, setNewCorrectionIds] = useState<Set<string>>(new Set()); // Track newly created corrections
  const [isAddingCorrection, setIsAddingCorrection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageInfos, setImageInfos] = useState<Map<string, ImageInfo>>(new Map());

  const { register, control, setValue, watch, reset } =
    useForm<ConceptualModel>();

  const simplificationList = useFieldArray({
    name: "simplifications",
    control,
  });

  const assumptionList = useFieldArray({
    name: "assumptions",
    control,
  });

  const inputList = useFieldArray({
    name: "inputs",
    control,
  });

  const outputList = useFieldArray({
    name: "outputs",
    control,
  });

  const entitiesList = useFieldArray({
    name: "entities",
    control,
  });

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

        // Load conceptual model into form
        reset(revisionData.version.conceptualModel);

        // Load corrections
        const loadedCorrections = revisionData.corrections || [];
        setCorrections(loadedCorrections);
        setOriginalCorrections(loadedCorrections);

        // Load image infos
        const newImageInfos = new Map<string, ImageInfo>();
        revisionData.imageInfos?.forEach((i) => {
          if (i.id) {
            newImageInfos.set(i.id, {
              id: i.id,
              sizeInBytes: i.sizeInBytes || 0,
              url: i.url,
              uploadedAt: new Date(i.createdAt),
              filename: i.originalFilename || "image",
            });
          }
        });
        setImageInfos(newImageInfos);
      }

      setIsLoading(false);
    }

    loadRevision();
  }, [revisionId, session?.user, reset]);

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
    setSelectedCorrectionId(null); // Deselect when changing tabs
    setIsAddingCorrection(false); // Cancel adding mode
  };

  // Handle correction selection
  const handleSelectCorrection = useCallback((correctionId: string | null) => {
    setSelectedCorrectionId((prev) =>
      prev === correctionId ? null : correctionId
    );
    setIsAddingCorrection(false);
  }, []);

  // Handle save corrections - accepts optional corrections list for immediate saves
  // NOTE: Must be defined before handleUpdateCorrection which uses it
  const handleSaveCorrections = useCallback(async (correctionsToUse?: Correction[], showToast = true) => {
    if (!revision) return;

    setIsSaving(true);
    
    // Use provided corrections or current state
    const correctionsList = correctionsToUse ?? corrections;
    
    // Prepare corrections for saving (remove temp IDs)
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
      // Update corrections with server-assigned IDs
      if (result.data?.corrections) {
        setCorrections(result.data.corrections);
        setOriginalCorrections(result.data.corrections);
        // Clear new correction tracking since they now have server IDs
        setNewCorrectionIds(new Set());
      }
    }

    setIsSaving(false);
  }, [revision, corrections, revisionId]);

  // Handle correction update with auto-save
  const handleUpdateCorrection = useCallback((updatedCorrection: Correction) => {
    // Compute the new corrections list
    const newCorrectionsList = corrections.map((c) =>
      c._id === updatedCorrection._id ? updatedCorrection : c
    );
    
    // Update local state
    setCorrections(newCorrectionsList);
    
    // Auto-save immediately (silently)
    handleSaveCorrections(newCorrectionsList, false);
  }, [corrections, handleSaveCorrections]);

  // Handle correction delete
  const handleDeleteCorrection = useCallback((correctionId: string) => {
    setCorrections((prev) => prev.filter((c) => c._id !== correctionId));
    setNewCorrectionIds((prev) => {
      const next = new Set(prev);
      next.delete(correctionId);
      return next;
    });
    setSelectedCorrectionId(null);
  }, []);

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
      
      // Update local state only - save happens when user clicks check icon
      setCorrections((prev) => [...prev, correctionWithId]);
      setSelectedCorrectionId(correctionWithId._id!);
      setNewCorrectionIds((prev) => new Set(prev).add(correctionWithId._id!));
      setIsAddingCorrection(false);
    },
    []
  );

  // Click outside to deselect
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on the container (not on a bubble or content)
    if (e.target === e.currentTarget) {
      setSelectedCorrectionId(null);
    }
  }, []);

  // Read-only register function - all fields are disabled in revision view
  const customRegisterField = useCallback(
    ({
      name,
    }: {
      name: any;
      propertyPath?: string;
      options?: any;
      propagateUpdateOnChange?: boolean;
    }) => {
      const registerResult = register(name);
      return {
        ...registerResult,
        onChange: registerResult.onChange,
        onBlur: registerResult.onBlur,
        readOnly: true,
        disabled: true,
      };
    },
    [register]
  );

  // Dummy handlers for read-only mode
  const handleAddItemToList = useCallback(() => {}, []);
  const handleRemoveItemFromList = useCallback(() => {}, []);

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
        isAddingCorrection={isAddingCorrection}
        onSave={handleSaveCorrections}
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
        {currentPageCorrections.map((correction, index) => {
          // Calculate the global index for numbering
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

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col overflow-hidden relative"
        >
          {/* Read-only overlay */}
          <div className="absolute inset-0 bg-gray-500/5 z-10 pointer-events-none" />
          
          <br />
          <Tabs
            value={currentTab}
            onValueChange={handleCurrentTabChange}
            defaultValue="descripcion-sistema"
            orientation="vertical"
            className="opacity-90"
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
              <DescripcionDelSistema
                hasEditingRights={false}
                assumptionList={assumptionList}
                simplificationList={simplificationList}
                watch={watch}
                customRegisterField={customRegisterField}
                handleAddItemToList={handleAddItemToList}
                handleRemoveItemFromList={handleRemoveItemFromList}
              />
            </TabsContent>

            <TabsContent value="diagrama-estructura">
              <DiagramaEstructura
                sessionToken={session?.auth}
                versionId={revision.version.id}
                hasEditingRights={false}
                imageInfos={imageInfos}
                watch={watch}
                control={control}
                customRegisterField={customRegisterField}
              />
            </TabsContent>

            <TabsContent value="diagrama-dinamica-entidades">
              <DiagramaDinamicaEntidades
                sessionToken={session?.auth}
                versionId={revision.version.id}
                hasEditingRights={false}
                imageInfos={imageInfos}
                watch={watch}
                control={control}
                entitiesList={entitiesList}
                customRegisterField={customRegisterField}
                handleAddItemToList={handleAddItemToList}
                handleRemoveItemFromList={handleRemoveItemFromList}
              />
            </TabsContent>

            <TabsContent value="objetivos-entradas-salidas">
              <ObjetivosEntradasSalidas
                hasEditingRights={false}
                inputList={inputList}
                outputList={outputList}
                entitiesList={entitiesList}
                watch={watch}
                customRegisterField={customRegisterField}
                handleAddItemToList={handleAddItemToList}
                handleRemoveItemFromList={handleRemoveItemFromList}
              />
            </TabsContent>

            <TabsContent value="alcance">
              <Alcance
                hasEditingRights={false}
                entitiesList={entitiesList}
                customRegisterField={customRegisterField}
                watch={watch}
              />
            </TabsContent>

            <TabsContent value="detalle">
              <Detalle
                hasEditingRights={false}
                entitiesList={entitiesList}
                control={control}
                customRegisterField={customRegisterField}
                handleAddItemToList={handleAddItemToList}
                handleRemoveItemFromList={handleRemoveItemFromList}
                watch={watch}
              />
            </TabsContent>

            <TabsContent value="flujo">
              <DiagramaFlujo
                sessionToken={session?.auth}
                versionId={revision.version.id}
                hasEditingRights={false}
                imageInfos={imageInfos}
                watch={watch}
                control={control}
                customRegisterField={customRegisterField}
              />
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  );
}
