"use client";

import {
	useEffect,
	useState,
	MouseEvent,
	useRef,
	ChangeEvent,
	useMemo,
	useCallback,
} from "react";
import { socket } from "@lib/socket";
import { Path, RegisterOptions, useFieldArray, useForm } from "react-hook-form";
import {
	ConceptualModel,
	ImageInfo,
	VersionState,
} from "#types/conceptual-model";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@components/ui/tabs/tabs";
import { useSession } from "next-auth/react";
import { useEditingRequests } from "@hooks/use-request-editing-rights";
import { useSocketConnection } from "@hooks/use-socket-connection";
import DescripcionDelSistema from "@components/conceptual-model/DescripcionDelSistema";
import React from "react";
import VersionBar from "@components/versions/VersionBar";
import {
	CLIENT_WS_EVENT_TYPES,
	Collaborator,
	InitializeConceptualModelPayload,
	JoinRoomEventPayload,
	SERVER_WS_EVENT_TYPES,
	SocketPosition,
	UsersInRoomChangePayload,
} from "#types/collaboration";
import { parsePropertyPath } from "@lib/utils";
import DiagramaEstructura from "@components/conceptual-model/DiagramaEstructura";
import DiagramaDinamicaEntidades from "@components/conceptual-model/DiagramaDinamicaEntidades";
import ObjetivosEntradasSalidas from "@components/conceptual-model/ObjetivosEntradasSalidas";
import Alcance from "@components/conceptual-model/Alcance";
import Detalle from "@components/conceptual-model/Detalle";
import DiagramaFlujo from "@components/conceptual-model/DiagramaDeFlujo";
import { RemoteCursor } from "@components/versions/RemoteCursor";
import { useUI } from "@components/ui/context";
import { FinalizeVersionModal } from "@components/versions/FinalizeVersionModal";
import { toast } from "sonner";
import { FinalizeVersionResultModal } from "@components/versions/FinalizeVersionResultModal";
import { useRouter } from "next/navigation";
import { getVersionForReadOnlyView } from "@components/dashboard/versions/actions/get-version-view";
import { Loader2 } from "lucide-react";


function throttle(func: any, delay: number) {
	let timeout: NodeJS.Timeout | null = null;
	return (...args: any) => {
		if (!timeout) {
			func(...args);
			timeout = setTimeout(() => {
				timeout = null;
			}, delay);
		}
	};
}

// Debounce delay for auto-saving field updates (ms)
const FIELD_UPDATE_DEBOUNCE_DELAY = 500;

const MOUSE_POSITION_UPDATE_DELAY = 33; //30 fps

export default function Page({
	params,
}: {
	params: Promise<{ roomId: string }>;
}) {
	const router = useRouter();
	const { data: session } = useSession();
	const { openModal, closeModal } = useUI();
	const { isConnected: isSocketConnected } = useSocketConnection({
		socket,
		sessionToken: session?.auth,
	});
	const { roomId } = React.use(params);

	const [currentTab, setCurrentTab] = useState("descripcion-sistema");
	const [isModelInitialized, setIsModelInitialized] = useState(false);
	const [title, setTitle] = useState("");
	const [versionState, setVersionState] = useState<VersionState>("EN EDICION");
	const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(
		new Map()
	);
	const [followingUserId, setFollowingUserId] = useState<string | null>(null);
	const [projectTitle, setProjectTitle] = useState("");
	const [ownerName, setOwnerName] = useState("");
	const [isCheckingAccess, setIsCheckingAccess] = useState(true);
	const [accessError, setAccessError] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const collaboratorsRef = useRef(collaborators);
	const sessionRef = useRef(session);

	// Track pending field updates for debounced auto-save
	const pendingUpdatesRef = useRef<
		Map<string, { value: any; timerId: NodeJS.Timeout }>
	>(new Map());

	// Keep refs in sync with state
	useEffect(() => {
		collaboratorsRef.current = collaborators;
	}, [collaborators]);

	useEffect(() => {
		sessionRef.current = session;
	}, [session]);

	// Verify user has access to this version (same safeguard as view page)
	useEffect(() => {
		async function checkAccess() {
			if (!session?.user || !roomId) {
				setIsCheckingAccess(false);
				return;
			}
			const result = await getVersionForReadOnlyView(roomId);
			if (result.error) {
				toast.error("Error al cargar la versión", {
					description: result.error,
				});
				setAccessError(result.error);
			} else if (result.data) {
				// Read-only users (e.g. shared readers) should use the view page
				if (result.data.canExportAndRequestRevision === false) {
					router.push(`/versions/${roomId}/view`);
					return;
				}
				setAccessError(null);
			}
			setIsCheckingAccess(false);
		}
		checkAccess();
	}, [roomId, session?.user, router]);

	// Check if the version is in an editable state
	const isVersionEditable = useMemo(() => {
		return versionState === "EN EDICION";
	}, [versionState]);

	const hasEditingRights = useMemo(() => {
		// Version must be in "EN EDICION" state AND user must have editing rights
		if (!isVersionEditable) return false;
		if (!session?.user.id) return false;
		return !!collaborators.get(session.user.id)?.hasEditingRights;
	}, [collaborators, session?.user.id, isVersionEditable]);

	const {
		canUserSendEditingRequest,
		pendingEditingRequests,
		handleCollaboratorsChange,
		handleRequestEditingRights,
		handleEditingRequestEvaluation,
	} = useEditingRequests({
		roomId,
		socket,
		userId: session?.user.id,
		hasEditingRights,
	});

	const [imageInfos, setImageInfos] = useState<Map<string, ImageInfo>>(
		new Map()
	);

	const { register, control, setValue, watch, getValues, reset } =
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

	const throttledEmitMouseUpdateFunction = useRef(
		throttle((roomId: string, mousePosition: any, currentTab: string) => {
			socket.volatile.emit("client-volatile-broadcast", {
				roomId,
				mousePosition,
				currentTab,
				timestamp: new Date(),
			});
		}, MOUSE_POSITION_UPDATE_DELAY)
	);

	useEffect(() => {
		if (isSocketConnected) {
			socket.emit(CLIENT_WS_EVENT_TYPES.JOIN_ROOM, {
				type: CLIENT_WS_EVENT_TYPES.JOIN_ROOM,
				roomId: roomId,
				timestamp: new Date(),
			} satisfies JoinRoomEventPayload);
		}

		// --- Handlers ---

		function onInitializeConceptualModel({
			version,
			imageInfos,
		}: InitializeConceptualModelPayload) {
			const conceptualModel = version.conceptualModel;
			setTitle(version.title);
			setVersionState(version.state ?? "EN EDICION");
			setProjectTitle(version.projectTitle ?? "");
			setOwnerName(version.ownerName ?? "");
			reset(conceptualModel);
			const newImageInfos = new Map<string, ImageInfo>();
			imageInfos
				.map((i) => ({
					id: i.id,
					sizeInBytes: i.sizeInBytes,
					url: i.url,
					uploadedAt: new Date(i.createdAt),
					originalFilename: i.originalFilename,
				}))
				.forEach((i) => newImageInfos.set(i.id, i));
			setImageInfos(newImageInfos);
			setIsModelInitialized(true);
		}

		function onUsersInRoomChange({ roomState }: UsersInRoomChangePayload) {
			const previousEditorUserId = collaborators
				.values()
				.find((c) => c.hasEditingRights)?.userId;
			const hasEditorChanged =
				previousEditorUserId !== roomState.currentEditingUser;
			const newCollaboratorUserIds = new Set<string>(
				roomState.collaborators.map((c) => c.userId)
			);

			setCollaborators((prevCollaborators) => {
				const newCollaborators = new Map<string, Collaborator>();
				for (const user of roomState.collaborators) {
					const existingCollaborator = prevCollaborators.get(user.userId);
					const hasEditingRights = roomState.currentEditingUser === user.userId;
					const newSocketPositions: Map<string, SocketPosition> = new Map();

					if (!existingCollaborator) {
						for (const socketId of user.socketIds) {
							newSocketPositions.set(socketId, { socketId });
						}
					} else {
						for (const socketId of user.socketIds) {
							const existingSocketPosition =
								existingCollaborator.sockets.get(socketId);
							newSocketPositions.set(
								socketId,
								existingSocketPosition
									? { ...existingSocketPosition }
									: { socketId }
							);
						}
					}

					newCollaborators.set(user.userId, {
						userId: user.userId,
						name: user.name,
						lastName: user.lastName,
						hasEditingRights,
						email: user.email,
						sockets: newSocketPositions,
					});
				}
				return newCollaborators;
			});
			handleCollaboratorsChange({
				hasEditorChanged,
				collaboratorUserIds: newCollaboratorUserIds,
			});
		}

		function onServerVolatileBroadcast(payload: {
			socketId: string;
			userId: string;
			currentTab: string;
			mousePosition?: { relativeX: number; relativeY: number };
		}) {
			setCollaborators((prevCollaborators) => {
				const newCollaborators = new Map(prevCollaborators);
				const existingCollaborator = newCollaborators.get(payload.userId);
				if (existingCollaborator) {
					const newSocketPositions = new Map(existingCollaborator.sockets);
					const existingSocketPosition = newSocketPositions.get(
						payload.socketId
					);
					newSocketPositions.set(payload.socketId, {
						...existingSocketPosition,
						socketId: payload.socketId,
						mousePosition:
							payload.mousePosition ?? existingSocketPosition?.mousePosition,
						currentTab: payload.currentTab,
					});
					newCollaborators.set(payload.userId, {
						...existingCollaborator,
						sockets: newSocketPositions,
					});
				}
				return newCollaborators;
			});
		}

		function onFieldUpdate(payload: {
			propertyPath: Path<ConceptualModel>;
			value: any;
		}) {
			const parsedPath = parsePropertyPath(getValues(), payload.propertyPath);
			setValue(parsedPath as Path<ConceptualModel>, payload.value, {
				shouldDirty: true,
				shouldValidate: true,
				shouldTouch: true,
			});
/* 			// TODO: LOOK AT THE CAUSE
			if (parsedPath?.startsWith("entities")) {
				setValue("entities", [...getValues("entities")], { shouldDirty: true });
			} */
		}

		function onItemAddedToList({
			listPropertyPath,
			newItem,
		}: {
			listPropertyPath: string;
			newItem: any;
		}) {
			const parsedPath: any = parsePropertyPath(getValues(), listPropertyPath);
			setValue(parsedPath, [...getValues(parsedPath), newItem]);
		}

		function onItemRemovedFromList({
			listPropertyPath,
			itemId,
		}: {
			listPropertyPath: Path<ConceptualModel>;
			itemId: string;
		}) {
			const parsedPath: any = parsePropertyPath(getValues(), listPropertyPath);
			const currentValue = getValues(listPropertyPath);
			if (Array.isArray(currentValue)) {
				setValue(parsedPath, [...currentValue.filter((s) => s._id !== itemId)]);
			}
		}

		function onImageAdded(payload: {
			imageInfo: Omit<ImageInfo, "uploadedAt"> & { uploadedAt: string };
		}) {
			setImageInfos((prev) => {
				const next = new Map(prev);
				next.set(payload.imageInfo.id, {
					...payload.imageInfo,
					uploadedAt: new Date(payload.imageInfo.uploadedAt),
				} as ImageInfo);
				return next;
			});
		}

		function onImageRemoved(payload: { imageId: string }) {
			setImageInfos((prev) => {
				const next = new Map(prev);
				next.delete(payload.imageId);
				return next;
			});
		}

		function onFinalizeVersionModal(_payload: { initiatedBy: string }) {
			const currentUserHasEditingRights = !!collaboratorsRef.current.get(
				sessionRef.current?.user.id || ""
			)?.hasEditingRights;
			openModal({
				name: "finalize-version-modal",
				title: "Finalizar Revisión",
				size: "md",
				showCloseButton: false,
				content: (
					<FinalizeVersionModal
						roomId={roomId}
						socket={socket}
						hasEditingRights={currentUserHasEditingRights}
						onClose={closeModal}
					/>
				),
			});
		}

		function onFinalizeVersionModalClose() {
			closeModal();
		}

		function onFinalizeVersionResult(payload: {
			isValid: boolean;
			errors: string[];
			warnings: string[];
		}) {
			closeModal();
			if (payload.isValid) {
				toast.success("Versión finalizada exitosamente");
				setTimeout(() => router.push(`/versions/${roomId}/view`), 2000);
			} else {
				openModal({
					name: "finalize-version-result-modal",
					title: "Error al Finalizar Versión",
					size: "md",
					showCloseButton: false,
					content: (
						<FinalizeVersionResultModal
							errors={payload.errors}
							warnings={payload.warnings}
							onClose={closeModal}
						/>
					),
				});
			}
		}

		// --- Subscriptions ---

		socket.on(
			SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL,
			onInitializeConceptualModel
		);
		socket.on(SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE, onUsersInRoomChange);
		socket.on("server-volatile-broadcast", onServerVolatileBroadcast);
		socket.on("field-update", onFieldUpdate);
		socket.on("item-added-to-list", onItemAddedToList);
		socket.on("item-removed-from-list", onItemRemovedFromList);
		socket.on("image-added", onImageAdded);
		socket.on("image-removed", onImageRemoved);
		socket.on("finalize-version-modal", onFinalizeVersionModal);
		socket.on("finalize-version-modal-close", onFinalizeVersionModalClose);
		socket.on("finalize-version-result", onFinalizeVersionResult);

		return () => {
			// --- Unsubscriptions ---
			socket.off(
				SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL,
				onInitializeConceptualModel
			);
			socket.off(
				SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE,
				onUsersInRoomChange
			);
			socket.off("server-volatile-broadcast", onServerVolatileBroadcast);
			socket.off("field-update", onFieldUpdate);
			socket.off("item-added-to-list", onItemAddedToList);
			socket.off("item-removed-from-list", onItemRemovedFromList);
			socket.off("image-added", onImageAdded);
			socket.off("image-removed", onImageRemoved);
			socket.off("finalize-version-modal", onFinalizeVersionModal);
			socket.off("finalize-version-modal-close", onFinalizeVersionModalClose);
			socket.off("finalize-version-result", onFinalizeVersionResult);
		};
	}, [isSocketConnected]);

	// Immediately send property update to backend
	const sendPropertyUpdate = useCallback(
		(value: any, propertyPath: string) => {
			if (!hasEditingRights) return;

			// Clear any pending debounced update for this field
			const pending = pendingUpdatesRef.current.get(propertyPath);
			if (pending) {
				clearTimeout(pending.timerId);
				pendingUpdatesRef.current.delete(propertyPath);
			}

			socket.emit("field-update", { roomId, propertyPath, value });
		},
		[hasEditingRights, roomId]
	);

	// Schedule a debounced property update
	const scheduleDebouncedUpdate = useCallback(
		(value: any, propertyPath: string) => {
			if (!hasEditingRights) return;

			// Clear existing timer for this field if any
			const existing = pendingUpdatesRef.current.get(propertyPath);
			if (existing) {
				clearTimeout(existing.timerId);
			}

			// Schedule new debounced update
			const timerId = setTimeout(() => {
				pendingUpdatesRef.current.delete(propertyPath);
				socket.emit("field-update", { roomId, propertyPath, value });
			}, FIELD_UPDATE_DEBOUNCE_DELAY);

			pendingUpdatesRef.current.set(propertyPath, { value, timerId });
		},
		[hasEditingRights, roomId]
	);

	// Flush all pending updates immediately (used before tab switch, navigation, etc.)
	const flushPendingUpdates = useCallback(() => {
		if (!hasEditingRights) return;

		pendingUpdatesRef.current.forEach(({ value, timerId }, propertyPath) => {
			clearTimeout(timerId);
			socket.emit("field-update", { roomId, propertyPath, value });
		});
		pendingUpdatesRef.current.clear();
	}, [hasEditingRights, roomId]);

	// Cleanup: flush pending updates on unmount or before page unload
	useEffect(() => {
		const handleBeforeUnload = () => {
			// Flush synchronously before page unloads
			pendingUpdatesRef.current.forEach(({ value, timerId }, propertyPath) => {
				clearTimeout(timerId);
				socket.emit("field-update", { roomId, propertyPath, value });
			});
			pendingUpdatesRef.current.clear();
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			// Flush pending updates when component unmounts
			flushPendingUpdates();
		};
	}, [flushPendingUpdates, roomId]);

	const handleMouseMove = (e: MouseEvent) => {
		//Had to change the previous implementation because using offsetX and offsetY caused inconsistent values
		//when scrollbars appeared
		const { width, height, left, top } =
			e.currentTarget.getBoundingClientRect();
		const xPosition = e.clientX - left;
		const yPosition = e.clientY - top;

		const mousePosition = {
			relativeX: xPosition / width,
			relativeY: yPosition / height,
		};

		throttledEmitMouseUpdateFunction.current(roomId, mousePosition, currentTab);
	};

	const handleCurrentTabChange = (newTab: string) => {
		// Flush any pending updates before switching tabs to prevent data loss
		flushPendingUpdates();

		setCurrentTab(newTab);
		socket.volatile.emit("client-volatile-broadcast", {
			roomId,
			currentTab: newTab,
			timestamp: new Date(),
		});
	};

	const handleAddItemToList = ({
		e,
		listPropertyPath,
		itemType,
	}: {
		e: MouseEvent;
		listPropertyPath: string;
		itemType:
			| "assumption"
			| "simplification"
			| "entity"
			| "input"
			| "output"
			| "property";
	}) => {
		e.preventDefault();
		socket.emit("add-item-to-list", { roomId, listPropertyPath, itemType });
	};

	const handleRemoveItemFromList = ({
		e,
		listPropertyPath,
		itemId,
	}: {
		e: MouseEvent;
		listPropertyPath: string;
		itemId: string;
	}) => {
		e.preventDefault();
		socket.emit("remove-item-from-list", { roomId, listPropertyPath, itemId });
	};

	const handleFollowUser = useCallback(
		(userId: string) => {
			if (followingUserId === userId) {
				// Unfollow if already following
				setFollowingUserId(null);
			} else {
				setFollowingUserId(userId);

				// Scroll to the user's position
				const collaborator = collaborators.get(userId);
				if (collaborator && containerRef.current) {
					// Find the first socket with a mouse position in the current tab
					for (const socket of collaborator.sockets.values()) {
						if (socket.mousePosition && socket.currentTab === currentTab) {
							const rect = containerRef.current.getBoundingClientRect();
							const targetX =
								rect.left + socket.mousePosition.relativeX * rect.width;
							const targetY =
								rect.top + socket.mousePosition.relativeY * rect.height;

							// Scroll to position smoothly
							window.scrollTo({
								left: targetX - window.innerWidth / 2,
								top: targetY - window.innerHeight / 2,
								behavior: "smooth",
							});
							break;
						}
					}
				}
			}
		},
		[followingUserId, collaborators, currentTab]
	);

	const customRegisterField = useCallback(
		({
			name,
			propertyPath = name,
			options = {},
			propagateUpdateOnChange = false,
		}: {
			name: Path<ConceptualModel>;
			propertyPath?: string;
			options?: RegisterOptions<ConceptualModel, Path<ConceptualModel>>;
			propagateUpdateOnChange?: boolean;
		}) => {
			const { ...registerOptions } = options;

			// Get the standard register result
			const registerResult = register(name, registerOptions);

			const enhancedRegister = {
				...registerResult,
				onChange: (
					e: ChangeEvent<
						HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
					>
				) => {
					// Call the original onChange handler
					registerResult.onChange(e);

					const target = e.target;
					const isCheckbox = target.type === "checkbox";
					const isSelectBox = target.tagName === "SELECT";

					// Capture field name synchronously - React synthetic events are pooled
					// and e.currentTarget becomes null after the handler returns
					const fieldName = target.name;

					// Get the value based on element type
					const getValue = () => {
						if (isCheckbox) {
							return (target as HTMLInputElement).checked;
						}
						// Get the current value from React Hook Form
						return getValues(fieldName as Path<ConceptualModel>);
					};

					if (propagateUpdateOnChange || isSelectBox) {
						// For selects and fields that need immediate propagation,
						// send update immediately (selects don't have "typing in progress" state)
						setTimeout(() => {
							const value = getValue();
							sendPropertyUpdate(value, propertyPath);
						}, 0);
					} else if (!isCheckbox) {
						// For text inputs, use debounced update
						// Schedule a debounced update so changes are auto-saved after typing stops
						setTimeout(() => {
							const value = getValue();
							scheduleDebouncedUpdate(value, propertyPath);
						}, 0);
					}
				},
				onBlur: (
					e: React.FocusEvent<
						HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
					>
				) => {
					// Call the original onBlur handler
					registerResult.onBlur(e);

					const target = e.target;
					const isCheckbox = target.type === "checkbox";
					const isSelectBox = target.tagName === "SELECT";

					// For selects with propagateUpdateOnChange, they already updated on change
					// Skip redundant blur update
					if (isSelectBox && propagateUpdateOnChange) {
						return;
					}

					// For checkboxes, get the value from e.target.checked, otherwise use getValues
					// Use target.name instead of e.currentTarget.name for consistency
					const value = isCheckbox
						? (target as HTMLInputElement).checked
						: getValues(target.name as Path<ConceptualModel>);

					// Always send immediate update on blur as a safeguard
					// This also clears any pending debounced updates
					sendPropertyUpdate(value, propertyPath);
				},
				readOnly: !hasEditingRights,
				disabled: !hasEditingRights,
			};

			return enhancedRegister;
		},
		[
			register,
			getValues,
			hasEditingRights,
			sendPropertyUpdate,
			scheduleDebouncedUpdate,
		]
	);

	// Check if the form should be in read-only mode (version not editable)
	const isFormReadOnly = !isVersionEditable;

	// Get all active cursors for the current tab
	const activeCursors = useMemo(() => {
		const cursors: Array<{
			collaborator: Collaborator;
			socketId: string;
			mousePosition: { relativeX: number; relativeY: number };
		}> = [];

		for (const collaborator of collaborators.values()) {
			// Skip current user
			if (collaborator.userId === session?.user.id) continue;

			for (const socket of collaborator.sockets.values()) {
				// Only show cursors for users in the same tab
				if (socket.mousePosition && socket.currentTab === currentTab) {
					cursors.push({
						collaborator,
						socketId: socket.socketId,
						mousePosition: socket.mousePosition,
					});
				}
			}
		}

		return cursors;
	}, [collaborators, currentTab, session?.user.id]);

	// Auto-scroll to followed user
	useEffect(() => {
		if (!followingUserId || !containerRef.current) return;

		const collaborator = collaborators.get(followingUserId);
		if (!collaborator) return;

		// Find the first socket with a mouse position in the current tab
		for (const socket of collaborator.sockets.values()) {
			if (socket.mousePosition && socket.currentTab === currentTab) {
				const rect = containerRef.current.getBoundingClientRect();
				const targetX = rect.left + socket.mousePosition.relativeX * rect.width;
				const targetY = rect.top + socket.mousePosition.relativeY * rect.height;

				// Smooth scroll to position
				const currentScrollX = window.scrollX + window.innerWidth / 2;
				const currentScrollY = window.scrollY + window.innerHeight / 2;
				const targetScrollX = targetX;
				const targetScrollY = targetY;

				// Only scroll if significantly different (avoid jitter)
				const distanceX = Math.abs(currentScrollX - targetScrollX);
				const distanceY = Math.abs(currentScrollY - targetScrollY);

				if (distanceX > 50 || distanceY > 50) {
					window.scrollTo({
						left: targetScrollX - window.innerWidth / 2,
						top: targetScrollY - window.innerHeight / 2,
						behavior: "smooth",
					});
				}
				break;
			}
		}
	}, [followingUserId, collaborators, currentTab, activeCursors]);

	//todo: enhance error message
	if (!roomId) return <>No version ID</>;

	if (isCheckingAccess) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
				<span className="ml-2 text-gray-600">Cargando versión...</span>
			</div>
		);
	}

	if (accessError) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p className="text-gray-500">No se pudo cargar la versión.</p>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="bg-grey-0 relative"
			onMouseMove={handleMouseMove}
		>
			{/* Remote cursors */}
			{activeCursors.map((cursor) => (
				<RemoteCursor
					key={cursor.socketId}
					collaborator={cursor.collaborator}
					socketId={cursor.socketId}
					mousePosition={cursor.mousePosition}
					containerRef={containerRef}
				/>
			))}
			<VersionBar
				canUserSendEditingRequest={canUserSendEditingRequest}
				handleRequestEditingRights={handleRequestEditingRights}
				pendingEditingRequests={pendingEditingRequests}
				collaborators={collaborators}
				handleEditingRequestEvaluation={handleEditingRequestEvaluation}
				title={title}
				projectTitle={projectTitle}
				ownerName={ownerName}
				onFollowUser={handleFollowUser}
				followingUserId={followingUserId}
				currentUserId={session?.user.id}
				roomId={roomId}
				socket={socket}
				versionState={versionState}
			/>

			{!isModelInitialized ? (
				<p>Loading Model</p>
			) : (
				<form
					onSubmit={(e) => {
						console.log("Form Submitted");
						e.preventDefault();
					}}
					className="flex flex-col overflow-hidden relative"
				>
					{/* Read-only overlay when version is not editable */}
					{isFormReadOnly && (
						<div className="absolute inset-0 bg-gray-500/10 z-10 pointer-events-none" />
					)}
					<br />
					<Tabs
						value={currentTab}
						onValueChange={handleCurrentTabChange}
						defaultValue="descripcion-sistema"
						orientation="horizontal"
						className={isFormReadOnly ? "opacity-75" : ""}
					>
						<TabsList className="h-full  flex ">
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
						<TabsContent value="descripcion-sistema" className="">
							<DescripcionDelSistema
								hasEditingRights={hasEditingRights}
								assumptionList={assumptionList}
								simplificationList={simplificationList}
								watch={watch}
								customRegisterField={customRegisterField}
								handleAddItemToList={handleAddItemToList}
								handleRemoveItemFromList={handleRemoveItemFromList}
							/>
						</TabsContent>

						<TabsContent value="diagrama-estructura" className="">
							<DiagramaEstructura
								sessionToken={session?.auth}
								versionId={roomId}
								hasEditingRights={hasEditingRights}
								imageInfos={imageInfos}
								watch={watch}
								control={control}
								customRegisterField={customRegisterField}
							/>
						</TabsContent>

						<TabsContent value="diagrama-dinamica-entidades">
							<DiagramaDinamicaEntidades
								sessionToken={session?.auth}
								versionId={roomId}
								hasEditingRights={hasEditingRights}
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
								hasEditingRights={hasEditingRights}
								inputList={inputList}
								outputList={outputList}
								watch={watch}
								control={control}
								customRegisterField={customRegisterField}
								handleAddItemToList={handleAddItemToList}
								handleRemoveItemFromList={handleRemoveItemFromList}
							/>
						</TabsContent>
						<TabsContent value="alcance">
							<Alcance
								hasEditingRights={hasEditingRights}
								customRegisterField={customRegisterField}
								watch={watch}
								control={control}
							/>
						</TabsContent>

						<TabsContent value="detalle">
							<Detalle
								hasEditingRights={hasEditingRights}
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
								versionId={roomId}
								hasEditingRights={hasEditingRights}
								imageInfos={imageInfos}
								watch={watch}
								control={control}
								customRegisterField={customRegisterField}
							/>
						</TabsContent>
					</Tabs>
				</form>
			)}
		</div>
	);
}
