"use client";

import { ConceptualModel, ImageInfo } from "#types/conceptual-model";
import {
	ChangeEvent,
	DragEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
	memo,
} from "react";
import { Path, Control, useWatch } from "react-hook-form";
import { AlertCircle, ImageIcon, Loader2, Upload } from "lucide-react";
import Image from "next/image";

const DiagramImageUploadComponent = ({
	title,
	versionId,
	diagramPropertyPath, //path absoluto del servidor a la propiedad del diagrama
	watch, //react hook forms para ver si un valor cambia (kept for backward compatibility, but using useWatch instead)
	control, //react hook forms control object for useWatch
	namePathPrefix, //path de react hookforms -- aca adentro voy a subscribir nuevas variables y necesito tener el prefijo hasta este momento. -- No pueod tener todo el path completo cuando tengo un elemento dentro de una lista porque necesito saber en que elemento me encuentro
	hasEditingRights,
	imageInfos,
	sessionToken,
	register,
}: {
	sessionToken?: string;
	versionId: string;
	hasEditingRights: boolean;
	imageInfos: Map<string, ImageInfo>;
	title: string;
	diagramPropertyPath: string;
	watch: (name?: string) => unknown;
	control: Control<ConceptualModel>;
	namePathPrefix: Path<ConceptualModel>;
	register: (config: {
		name: Path<ConceptualModel>;
		propertyPath?: string;
		propagateUpdateOnChange?: boolean;
	}) => Record<string, unknown>;
}) => {
	const [uploadState, setUploadState] = useState<{
		success: boolean;
		error?: string;
	}>({ success: false });
	const [isUploadPending, setIsUploadPending] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	/*   const [plantTextImageUrl, setPlantTextImageUrl] = useState<
    string | undefined
  >(); */
	// const [optimisticFile, setOptimisticFile] = useState<ImageInfo | null>(null);

	// Only set error from uploadState when it changes (not when error changes)
	useEffect(() => {
		if (uploadState.error) {
			setError(uploadState.error);
		}
	}, [uploadState]);

	// PlantText functionality
	// Use useWatch to ensure re-renders when values change
	const usePlantTextValue = useWatch({
		control,
		name: `${namePathPrefix}.usePlantText` as Path<ConceptualModel>,
	});
	const usePlantText = Boolean(usePlantTextValue);
	const plantTextToken = useWatch({
		control,
		name: `${namePathPrefix}.plantTextToken` as Path<ConceptualModel>,
	});
	const imageFileId = useWatch({
		control,
		name: `${namePathPrefix}.imageFileId` as Path<ConceptualModel>,
	}) as string | null;

	const imageFileInfo = useMemo(() => {
		if (!imageFileId) return null;

		return imageInfos.get(imageFileId);
	}, [imageFileId, imageInfos]);

	// Clear optimistic preview when authoritative id changes
	/*   useEffect(() => {
    if (optimisticFile && imageFileId) {
      setOptimisticFile(null);
    }
    return () => {};
  }, [imageFileId, optimisticFile]); */

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const uploadFileToServer = async (selectedFile: File) => {
		setError(null);
		setUploadState({ success: false });
		setIsUploadPending(true);

		const formData = new FormData();
		formData.append("image", selectedFile);
		formData.append("diagramPropertyPath", diagramPropertyPath);

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/uploads/${versionId}/diagrams`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${sessionToken}`,
					},
					body: formData,
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.log("errorData", errorData);
				setUploadState({
					success: false,
					error: errorData.error || "Image upload failed.",
				});
				return;
			}

			const data = (await response.json().catch(() => null)) as {
				imageInfo?: {
					id: string;
					url: string;
					originalFilename?: string;
					sizeInBytes?: number;
					createdAt?: string;
				};
			} | null;
			/*       if (data && data.imageInfo) {
        setOptimisticFile({
          id: data.imageInfo.id,
          url: data.imageInfo.url,
          filename: data.imageInfo.originalFilename || "image",
          sizeInBytes: data.imageInfo.sizeInBytes ?? 0,
          uploadedAt: data.imageInfo.createdAt
            ? new Date(data.imageInfo.createdAt)
            : new Date(),
        });
      } */

			// Set usePlantText to false when uploading an image
			/*       if (socket) {
        socket.emit("field-update", {
          roomId: versionId,
          propertyPath: `${diagramPropertyPath}.usePlantText`,
          value: false,
        });
      } */

			setUploadState({ success: true });
		} catch (error) {
			console.error("Unexpected error during diagram image upload:", error);
			setUploadState({
				success: false,
				error: "Something went wrong.",
			});
		} finally {
			setIsUploadPending(false);
		}
	};

	const replaceFileOnServer = async (selectedFile: File) => {
		setError(null);
		setUploadState({ success: false });
		setIsUploadPending(true);

		const formData = new FormData();
		formData.append("image", selectedFile);
		formData.append("diagramPropertyPath", diagramPropertyPath);

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/uploads/${versionId}/diagrams/replace`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${sessionToken}`,
					},
					body: formData,
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.log("errorData", errorData);
				setUploadState({
					success: false,
					error: errorData.error || "Image replace failed.",
				});
				return;
			}

			const data = (await response.json().catch(() => null)) as {
				imageInfo?: {
					id: string;
					url: string;
					originalFilename?: string;
					sizeInBytes?: number;
					createdAt?: string;
				};
			} | null;
			/*       if (data && data.imageInfo) {
        setOptimisticFile({
          id: data.imageInfo.id,
          url: data.imageInfo.url,
          filename: data.imageInfo.originalFilename || "image",
          sizeInBytes: data.imageInfo.sizeInBytes ?? 0,
          uploadedAt: data.imageInfo.createdAt
            ? new Date(data.imageInfo.createdAt)
            : new Date(),
        });
      } */

			// Set usePlantText to false when replacing with an image
			/*       if (socket) {
        socket.emit("field-update", {
          roomId: versionId,
          propertyPath: `${diagramPropertyPath}.usePlantText`,
          value: false,
        });
      } */

			setUploadState({ success: true });
		} catch (error) {
			console.error("Unexpected error during diagram image replace:", error);
			setUploadState({
				success: false,
				error: "Something went wrong.",
			});
		} finally {
			setIsUploadPending(false);
		}
	};

	const validateAndUploadFile = (selectedFile: File) => {
		// Validate file type
		if (!selectedFile.type.startsWith("image/")) {
			setError("Please select an image file");
			return;
		}

		// Validate file size (max 5MB)
		const maxSize = 5 * 1024 * 1024;
		if (selectedFile.size > maxSize) {
			setError(`File size must be less than ${formatFileSize(maxSize)}`);
			return;
		}
		uploadFileToServer(selectedFile);
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragOver(false);

		if (imageFileInfo || isUploadPending) return;

		if (!e.dataTransfer) return;

		const files = Array.from(e.dataTransfer.files);
		if (files.length > 1) {
			setError("Please select only one image");
			return;
		}

		if (files[0]) {
			validateAndUploadFile(files[0]);
		}
	};

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (!imageFileInfo && !isUploadPending) {
			setDragOver(true);
		}
	};

	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragOver(false);
	};

	const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (isUploadPending) return;

		const selectedFile = e.target.files?.[0];
		if (!selectedFile) {
			e.target.value = "";
			return;
		}

		// Validate first
		if (!selectedFile.type.startsWith("image/")) {
			setError("Please select an image file");
			e.target.value = "";
			return;
		}
		const maxSize = 5 * 1024 * 1024;
		if (selectedFile.size > maxSize) {
			setError(`File size must be less than ${formatFileSize(maxSize)}`);
			e.target.value = "";
			return;
		}

		if (imageFileInfo) {
			replaceFileOnServer(selectedFile);
		} else {
			uploadFileToServer(selectedFile);
		}

		e.target.value = ""; // Reset input
	};

	const clearError = () => {
		setError(null);
		// Also clear uploadState.error so the useEffect doesn't re-set the error
		setUploadState((prev) => ({ ...prev, error: undefined }));
	};

	// Include optimisticFile in the check - after upload, file might not be set yet
	// but optimisticFile will have the uploaded image data
	const hasFile = !!imageFileInfo;
	const canUpload = !hasFile && !isUploadPending && hasEditingRights;

	return (
		<div className="space-y-4">
			{/* Hidden file input always available for upload/replace */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileInputChange}
				className="hidden"
			/>
			{/* Header */}
			<div>
				<div className="flex items-center gap-2 text-base font-semibold text-card-foreground mb-2">
					<ImageIcon className="h-5 w-5" />
					{title}
				</div>
				<p className="text-sm text-muted-foreground">
					Generá tu diagrama utilizando PlantText o cargá una imagen (max 5MB)
				</p>
			</div>

			{/* Content */}
			<div className="space-y-4">
				{/* PlantText Toggle */}
				<div className="flex items-center gap-2">
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							{...register({
								name: `${namePathPrefix}.usePlantText` as Path<ConceptualModel>,
								propertyPath: `${diagramPropertyPath}.usePlantText`,
								propagateUpdateOnChange: true,
							})}
							className="rounded border-gray-300"
						/>
						<span className="text-sm font-medium">Usar PlantText</span>
					</label>
				</div>

				{usePlantText && (
					<div className="grid grid-cols-2 w-full h-full gap-4">
						{/* PlantText Code Input */}
						<div className="space-y-2 h-full flex-col flex">
							<label className="text-sm font-medium">Código PlantText:</label>
							<textarea
								{...register({
									name: `${namePathPrefix}.plantTextCode` as Path<ConceptualModel>,
									propertyPath: `${diagramPropertyPath}.plantTextCode`,
								})}
								placeholder="Ingresa tu código PlantText aquí..."
								className="w-full min-h-[500px] flex-1 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						{/* PlantText Image Display */}
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Vista previa del diagrama:
							</label>
							{plantTextToken && (
								<div className="overflow-hidden rounded-lg border">
									<img
										src={`http://www.plantuml.com/plantuml/img/${plantTextToken}`}
										alt="PlantText Diagram"
										className="w-full object-contain min-h-[500px] bg-white"
										onError={() => {
											console.error(
												"Failed to load PlantText image:",
												`http://www.plantuml.com/plantuml/img/${plantTextToken}`
											);
										}}
									/>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Error Alert */}
				{error && (
					<div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
						<AlertCircle className="h-4 w-4 flex-shrink-0" />
						<div className="flex items-center justify-between w-full">
							<span className="text-sm">{error}</span>
							<button
								onClick={clearError}
								className="text-xs underline hover:no-underline ml-4"
							>
								Descartar
							</button>
						</div>
					</div>
				)}

				{/* Upload Area or File Display */}
				{!usePlantText && (
					<>
						{!hasFile ? (
							<div
								className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
									dragOver && canUpload
										? "border-primary bg-primary/5"
										: canUpload
										? "border-muted-foreground/25 hover:border-muted-foreground/50"
										: "border-muted bg-muted/30 cursor-not-allowed"
								}`}
								onClick={(e) => {
									e.preventDefault();
									fileInputRef.current?.click();
								}}
								onDrop={handleDrop}
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
							>
								{isUploadPending ? (
									<div className="space-y-4">
										<Loader2 className="mx-auto h-8 w-8 text-primary animate-spin" />
										<div className="space-y-2">
											<p className="text-sm font-medium">Uploading...</p>
										</div>
									</div>
								) : (
									<div className="space-y-4">
										<Upload className="mx-auto h-12 w-12 text-muted-foreground" />
										<div className="space-y-2">
											<p className="text-base font-medium">
												Drop image here or click to upload
											</p>
											<p className="text-sm text-muted-foreground">
												PNG, JPG, JPEG up to 5MB
											</p>
										</div>
									</div>
								)}
							</div>
						) : (
							/* File Display */
							<div className="space-y-4">
								{/* Image Preview */}
								<div className="overflow-hidden rounded-lg border">
									<img
										src={imageFileInfo?.url || ""}
										alt={imageFileInfo?.originalFilename || "Diagram"}
										className="object-contain min-h-[500px] w-full bg-white"
									/>
								</div>
							</div>
						)}

						{/* Action Buttons */}
						<div className="flex gap-2">
							{!hasFile && !isUploadPending && (
								<button
									type="button"
									disabled={!canUpload}
									onClick={(e) => {
										e.preventDefault();
										fileInputRef.current?.click();
									}}
									className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
								>
									<Upload className="w-4 h-4 mr-2" />
									Select Image
								</button>
							)}

							{hasFile && !isUploadPending && (
								<button
									type="button"
									disabled={!hasEditingRights}
									onClick={(e) => {
										e.preventDefault();
										fileInputRef.current?.click();
									}}
									className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-background border border-border text-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
								>
									<Upload className="w-4 h-4 mr-2" />
									Replace Image
								</button>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
};

DiagramImageUploadComponent.displayName = "DiagramImageUpload";

export const DiagramImageUpload = memo(DiagramImageUploadComponent);
