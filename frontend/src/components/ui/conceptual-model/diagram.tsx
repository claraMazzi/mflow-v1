"use client";

import { ConceptualModel, ImageInfo } from "#types/conceptual-model";
import {
	ChangeEvent,
	DragEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Path } from "react-hook-form";
import {
	AlertCircle,
	ImageIcon,
	Loader2,
	Upload,
} from "lucide-react";
import Image from "next/image";

function debounce<TArgs extends unknown[]>(func: (...args: TArgs) => void, delay: number) {
	let timeout: NodeJS.Timeout | null = null;
	return (...args: TArgs) => {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			func(...args);
		}, delay);
	};
}

const DEBOUNCE_DIAGRAM_RENDER_DELAY = 3000;

// export default function Diagram({ //tiene que soportar ambas funciones archivo o plant text
// 	register,
// 	watch,
// 	namePrefix,
// 	propertyPathPrefix = namePrefix,
// 	socket,
// 	roomId,
// 	hasEditingRights,
// }: {
// 	register: any;
// 	watch: any;
// 	namePrefix: Path<ConceptualModel>;
// 	propertyPathPrefix?: string;
// 	socket?: any;
// 	roomId?: string;
// 	hasEditingRights?: boolean;
// }) {
// 	const [imgSource, setImageSource] = useState<undefined | string>();
// 	const debouncedEmitPlantTextChange = useRef(
// 		debounce((value: any, propertyPath: string) => {
// 			if (socket && roomId && hasEditingRights) {
// 				socket.emit("plant-text-code-change", {
// 					type: "plant-text-code-change",
// 					roomId,
// 					propertyPath,
// 					plantTextCode: value,
// 					timestamp: new Date(),
// 				});
// 			}
// 		}, DEBOUNCE_DIAGRAM_RENDER_DELAY)
// 	);
// 	const plantTextCodeValue = watch(`${namePrefix}.plantTextCode`);
// 	const usesPlantTextValue = watch(`${namePrefix}.usesPlantText`);
// 	const imageFileId = watch(`${namePrefix}.imageFileId`);

// 	useEffect(() => {
// 		if (usesPlantTextValue) {
// 			// Emit plantTextCode change to server instead of generating image locally
// 			debouncedEmitPlantTextChange.current(plantTextCodeValue, `${propertyPathPrefix}`);
// 		} else {
// 			setImageSource(imageFileId);
// 		}
// 		return () => {};
// 	}, [plantTextCodeValue, usesPlantTextValue, imageFileId, propertyPathPrefix]);

// 	// Listen for plantText image updates from server
// 	useEffect(() => {
// 		if (!socket) return;

// 		const handlePlantTextImageUpdate = (payload: {
// 			propertyPath: string;
// 			imageUrl: string;
// 			plantTextToken: string;
// 		}) => {
// 			// Check if this update is for our diagram
// 			if (payload.propertyPath === propertyPathPrefix) {
// 				setImageSource(payload.imageUrl);
// 			}
// 		};

// 		socket.on("plant-text-image-update", handlePlantTextImageUpdate);

// 		return () => {
// 			socket.off("plant-text-image-update", handlePlantTextImageUpdate);
// 		};
// 	}, [socket, propertyPathPrefix]);

// 	const checkboxRegister = register({
// 		name: `${namePrefix}.usesPlantText`,
// 		propertyPath: `${propertyPathPrefix}.usesPlantText`,
// 		propagateUpdateOnChange: true,
// 	});

// 	return (
// 		<>
// 			<label>Utiliza PlanText: </label>
// 			<input
// 				type="checkbox"
// 				{...checkboxRegister}
// 				className={`${checkboxRegister.readOnly && "pointer-events-none"}`}
// 			/>
// 			<div className="flex flex-row gap-2">
// 				{usesPlantTextValue ? (
// 					<textarea
// 						className="flex-grow max-w-[50%]"
// 						{...register({
// 							name: `${namePrefix}.plantTextCode`,
// 							propertyPath: `${propertyPathPrefix}.plantTextCode`,
// 						})}
// 					/>
// 				) : (
// 					//TODO: FIX UPLOAD TO USE THE NEW ENDPOINT
// 					<input
// 						type="file"
// 						accept=".png, .jpg, .jpeg"
// 						onChange={(e) => {
// 							const files = e.currentTarget.files;
// 							if (!files || files.length == 0) return;
// 						}}
// 					/>
// 				)}
// 				<img alt="Diagram" src={imgSource} />
// 				<Dialog></Dialog>
// 			</div>
// 		</>
// 	);
// }

export const DiagramImageUpload = ({
	title,
	versionId,
	diagramPropertyPath, //path absoluto del servidor a la propiedad del diagrama 
	watch, //react hook forms para ver si un valor cambia
	namePathPrefix, //path de react hookforms -- aca adentro voy a subscribir nuevas variables y necesito tener el prefijo hasta este momento. -- No pueod tener todo el path completo cuando tengo un elemento dentro de una lista porque necesito saber en que elemento me encuentro
	hasEditingRights,
	imageInfos,
	sessionToken,
	socket,
	register,
}: {
	sessionToken?: string;
	versionId: string;
	hasEditingRights: boolean;
	imageInfos: Map<string, ImageInfo>;
	title: string;
	diagramPropertyPath: string;
	watch: (name?: string) => unknown;
	namePathPrefix: Path<ConceptualModel>;
	socket?: {
		emit: (event: string, payload: Record<string, unknown>) => void;
		on: (event: string, handler: (...args: unknown[]) => void) => void;
		off: (event: string, handler: (...args: unknown[]) => void) => void;
	};
	register?: (config: {
		name: string;
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
	const [plantTextImageUrl, setPlantTextImageUrl] = useState<string | undefined>();

	useEffect(() => {
		if (uploadState.error) {
			setError(uploadState.error);
		}
		return () => {};
	}, [uploadState, error]);

	// PlantText functionality
	const usesPlantTextValue = watch(`${namePathPrefix}.usesPlantText`);
	const usesPlantText = Boolean(usesPlantTextValue);
	const plantTextCodeValue = watch(`${namePathPrefix}.plantTextCode`);

	const debouncedEmitPlantTextChange = useRef(
		debounce<[string, string]>((value: string, propertyPath: string) => {
			if (socket && versionId && hasEditingRights) {
				console.log("Emitting plant-text-code-change:", value);
				socket.emit("plant-text-code-change", {
					type: "plant-text-code-change",
					versionId,
					propertyPath,
					plantTextCode: value,
					timestamp: new Date(),
				});
			}
		}, DEBOUNCE_DIAGRAM_RENDER_DELAY)
	);


	useEffect(() => {
		if (usesPlantText && plantTextCodeValue) {
			// Emit plantTextCode change to server instead of generating image locally
			debouncedEmitPlantTextChange.current(String(plantTextCodeValue), diagramPropertyPath);
		}
	}, [plantTextCodeValue, usesPlantText, diagramPropertyPath]);

	// Get existing plantText image on component mount if there's existing code
	const hasRequestedInitialImage = useRef(false);
	useEffect(() => {
	if (usesPlantText && plantTextCodeValue && socket && versionId && !hasRequestedInitialImage.current) {
			// Request existing image without generating a new one
			hasRequestedInitialImage.current = true;
			socket.emit("plant-text-get-image", {
				type: "plant-text-get-image",
				versionId,
				propertyPath: diagramPropertyPath,
				timestamp: new Date(),
			});
		}
	}, [usesPlantText, plantTextCodeValue, socket, versionId, diagramPropertyPath]);

	// Listen for plantText image updates from server
	useEffect(() => {
		if (!socket) return;

		const handlePlantTextImageUpdate = (...args: unknown[]) => {
			const payload = args[0] as {
				propertyPath: string;
				imageUrl: string;
				plantTextToken: string;
			};
			console.log("payload", payload);
			// Check if this update is for our diagram
			if (payload.propertyPath === diagramPropertyPath) {
				setPlantTextImageUrl(payload.imageUrl);
			}
		};

		socket.on("plant-text-image-update", handlePlantTextImageUpdate);

		return () => {
			socket.off("plant-text-image-update", handlePlantTextImageUpdate);
		};
	}, [socket, diagramPropertyPath]);

	const imageFileField = watch(`${namePathPrefix}.imageFileId`) as unknown;

	type PopulatedImageInfo = {
		id?: string;
		_id?: string;
		url?: string;
		sizeInBytes?: number;
		originalFilename?: string;
		filename?: string;
		createdAt?: string | Date;
	};

	const file = useMemo(() => {
		if (!imageFileField) return null;
		// If backend populated the image object directly (after aggregation)
		if (typeof imageFileField === "object" && imageFileField !== null && "url" in (imageFileField as Record<string, unknown>)) {
			const populated = imageFileField as PopulatedImageInfo;
			const createdAt = populated.createdAt;
			const originalFilename = populated.originalFilename;
			return {
				id: populated.id ?? populated._id ?? "",
				url: populated.url ?? "",
				sizeInBytes: populated.sizeInBytes ?? 0,
				filename: originalFilename || populated.filename || "image",
				uploadedAt: createdAt ? new Date(createdAt) : new Date(),
			} as ImageInfo;
		}
		// Else, it's likely an id string – resolve from the provided map
		if (typeof imageFileField === "string") {
			return imageInfos.get(imageFileField) ?? null;
		}
		return null;
	}, [imageFileField, imageInfos]);

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

// const deleteFileFromServer = async () => {
// 	if (!file) return;
// };

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

		if (file || isUploadPending) return;

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
		if (!file && !isUploadPending) {
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

		// Decide: new upload or replace existing
		if (file) {
			replaceFileOnServer(selectedFile);
		} else {
			uploadFileToServer(selectedFile);
		}

		e.target.value = ""; // Reset input
	};

	const clearError = () => {
		setError(null);
	};

	useEffect(() => {
		// no-op placeholder to react to url changes if needed later
		return () => {};
	}, [plantTextImageUrl]);
	

	const hasFile = !!file;
	const canUpload = !hasFile && !isUploadPending && hasEditingRights;

	console.log('file', file);

// Precompute register props to avoid inline conditional spreads confusing TSX
const checkboxRegisterProps = register
		? register({
			name: `${namePathPrefix}.usesPlantText`,
			propertyPath: `${diagramPropertyPath}.usesPlantText`,
			propagateUpdateOnChange: true,
		})
		: undefined;
	const checkboxProps: React.InputHTMLAttributes<HTMLInputElement> | undefined = checkboxRegisterProps as unknown as React.InputHTMLAttributes<HTMLInputElement>;

const plantTextRegisterProps = register
		? register({
			name: `${namePathPrefix}.plantTextCode`,
			propertyPath: `${diagramPropertyPath}.plantTextCode`,
		})
		: undefined;
	const textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement> | undefined = plantTextRegisterProps as unknown as React.TextareaHTMLAttributes<HTMLTextAreaElement>;

	return (
		<div className="w-full space-y-4">
			{/* Hidden file input always available for upload/replace */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileInputChange}
				className="hidden"
			/>
			{/* Header */}
			<div >
				<div className="flex items-center gap-2 text-lg font-semibold text-card-foreground mb-2">
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
						{...(checkboxProps as React.InputHTMLAttributes<HTMLInputElement> || {})}
							className="rounded border-gray-300"
						/>
						<span className="text-sm font-medium">Usar PlantText</span>
					</label>
				</div>

				{/* PlantText Code Input */}
	{usesPlantText ? (
					<div className="space-y-2">
						<label className="text-sm font-medium">Código PlantText:</label>
					<textarea
					{...(textareaProps as React.TextareaHTMLAttributes<HTMLTextAreaElement> || {})}
							onBlur={(e) => {
								// Request existing image on blur to ensure the image is shown
								if (e.target.value && socket && versionId) {
									socket.emit("plant-text-get-image", {
										type: "plant-text-get-image",
										versionId,
										propertyPath: diagramPropertyPath,
										timestamp: new Date(),
									});
								}
							}}
							placeholder="Ingresa tu código PlantText aquí..."
							className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
				) : null}

				{/* PlantText Image Display */}
				{usesPlantText && plantTextImageUrl ? (
					<div className="space-y-2">
						<label className="text-sm font-medium">Vista previa del diagrama:</label>
						<div className="relative overflow-hidden rounded-lg border h-screen">
							<Image
								src={plantTextImageUrl}
								fill
								alt="PlantText Diagram"
								className="w-full h-full object-contain bg-white"
							/>
						</div>
					</div>
				) : null}

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
								Dismiss
							</button>
						</div>
					</div>
				)}

				{/* Upload Area or File Display */}
	{!usesPlantText ? (
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
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
					>
						{canUpload && null}

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
						<div className="relative overflow-hidden rounded-lg border h-screen">
							
							<img
								src={file.url}
								alt={file.filename}
								className="w-full h-full object-contain bg-white"
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
				) : null}
			</div>
		</div>
	);
};
