"use client";

import {
	useEffect,
	useState,
	MouseEvent,
	FocusEvent,
	useRef,
	ChangeEvent,
	useMemo,
} from "react";
import { io } from "socket.io-client";
import { socket } from "../../socket";
import { lightningCssTransform } from "next/dist/build/swc/generated-native";
import { set, string } from "zod";
import {
	Path,
	RegisterOptions,
	useFieldArray,
	useForm,
	UseFormRegister,
} from "react-hook-form";
import Diagram from "@components/ui/conceptual-model/diagram";
import { ConceptualModel } from "#types/conceptual-model";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@src/components/ui/tabs/tabs";
import { Input } from "@src/components/ui/common/input";
import { useSession } from "@node_modules/next-auth/react";
import { Button } from "@src/components/ui/common/button";
import {
	ActiveEditingRequest,
	useEditingRequests,
} from "@src/hooks/use-request-editing-rights";
import EditingRequestNotification from "@src/components/ui/conceptual-model/editing-request-notification";

type BaseSocketEventPayload = { type: string; timestamp: Date };

enum CLIENT_WS_EVENT_TYPES {
	JOIN_ROOM = "join-room",
}

type JoinRoomEventPayload = BaseSocketEventPayload & {
	type: CLIENT_WS_EVENT_TYPES.JOIN_ROOM;
	roomId: string;
};

type UsersInRoomChangePayload = BaseSocketEventPayload & {
	type: SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE;
	roomState: {
		roomId: string;
		currentEditingUser: string | null;
		collaborators: {
			userId: string;
			name: string;
			lastName: string;
			email: string;
			socketIds: string[];
		}[];
	};
};

type InitializeConceptualModelPayload = BaseSocketEventPayload & {
	type: SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL;
	conceptualModel: any;
};

enum SERVER_WS_EVENT_TYPES {
	FIRST_IN_ROOM = "first-in-room",
	USERS_IN_ROOM_CHANGE = "users-in-room-change",
	INITIALIZE_CONCEPTUAL_MODEL = "initialize-conceptual-model",
}

type SocketPosition = Readonly<{
	socketId: string;
	mousePosition?: { relativeX: number; relativeY: number };
	currentTab?: string;
}>;

export type Collaborator = Readonly<{
	userId: string;
	name: string;
	lastName: string;
	email: string;
	sockets: Map<string, SocketPosition>;
	hasEditingRights: boolean;
}>;

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

function parsePropertyPath(conceptualModel: ConceptualModel, path: string) {
	const pathParts = path.split(".");
	const parsedPath = [];
	let current: any = conceptualModel;

	for (const part of pathParts) {
		const containsListItemKey = part.includes(":");
		if (containsListItemKey) {
			const [listProperty, itemId] = part.split(":");
			if (!(listProperty in current) || !Array.isArray(current[listProperty])) {
				return undefined;
			}
			const itemIndex = current[listProperty].findIndex(
				(e: any) => e._id === itemId
			);
			if (itemIndex === -1) {
				return undefined;
			}
			parsedPath.push(listProperty);
			parsedPath.push(itemIndex);
			current = current[listProperty][itemIndex];
		} else {
			if (!(part in current)) {
				return undefined;
			}
			parsedPath.push(part);
			current = current[part];
		}
	}
	return parsedPath.join(".");
}

const MOUSE_POSITION_UPDATE_DELAY = 33; //30 fps

export default function Page() {
	const { data: session } = useSession();
	const [isConnected, setIsConnected] = useState(false);
	const [transport, setTransport] = useState("N/A");
	const [currentTab, setCurrentTab] = useState("objetivo-suposiciones");
	const [isModelInitialized, setIsModelInitialized] = useState(false);
	const [roomId, setRoomId] = useState("67d8321cd76cf5bc5bd75c79");

	const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(
		new Map()
	);
	const hasEditingRights = useMemo(() => {
		if (!session) return false;
		return !!collaborators.get(session.user.id)?.hasEditingRights;
	}, [collaborators]);

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

	const {
		register,
		control,
		setValue,
		watch,
		getValues,
		reset,
		formState: { errors },
	} = useForm<ConceptualModel>();
	const simplificationList = useFieldArray({
		name: "simplifications",
		control,
	});
	const assumptionList = useFieldArray({
		name: "assumptions",
		control,
	});
	const entitiesList = useFieldArray({
		name: "entities",
		control,
	});

	const throttledEmitMouseUpdateFunction = useRef(
		throttle((roomId: any, mousePosition: any, currentTab: string) => {
			socket.volatile.emit("client-volatile-broadcast", {
				roomId,
				mousePosition,
				currentTab,
				timestamp: new Date(),
			});
		}, MOUSE_POSITION_UPDATE_DELAY)
	);

	useEffect(() => {
		if (session) {
			socket.auth = {
				sessionToken: session.auth,
			};
			socket.connect();
		}

		function onConnect() {
			setIsConnected(true);
			setTransport(socket.io.engine.transport.name);

			socket.io.engine.on("upgrade", (transport) => {
				setTransport(transport.name);
			});
			socket.emit(CLIENT_WS_EVENT_TYPES.JOIN_ROOM, {
				type: CLIENT_WS_EVENT_TYPES.JOIN_ROOM,
				roomId: roomId,
				timestamp: new Date(),
			} satisfies JoinRoomEventPayload);
		}

		function onDisconnect() {
			setIsConnected(false);
			setTransport("N/A");
		}

		function onFieldUpdate(payload: { propertyPath: any; value: any }) {
			console.log(
				`Server Sent Update ${payload.propertyPath}: ${payload.value}`
			);
			const parsedPath = parsePropertyPath(getValues(), payload.propertyPath);
			setValue(parsedPath as any, payload.value);
		}

		function onServerVolatileBroadcast(payload: {
			socketId: string;
			userId: string;
			currentTab: string;
			mousePosition?: { relativeX: number; relativeY: number };
		}) {
			setCollaborators((prevCollaborators) => {
				const newCollaborators = new Map<string, Collaborator>();
				for (const userId of prevCollaborators.keys()) {
					const existingCollaborator = prevCollaborators.get(userId)!;

					if (userId !== payload.userId) {
						newCollaborators.set(userId, { ...existingCollaborator });
						continue;
					}

					const newSocketPositions: Map<string, SocketPosition> = new Map();

					for (const socketId of existingCollaborator.sockets.keys()) {
						const existingSocketPosition =
							existingCollaborator.sockets.get(socketId)!;

						if (socketId === payload.socketId) {
							if (payload.mousePosition) {
								newSocketPositions.set(socketId, {
									...existingSocketPosition,
									mousePosition: payload.mousePosition,
									currentTab: payload.currentTab,
								});
							} else {
								newSocketPositions.set(socketId, {
									...existingSocketPosition,
									currentTab: payload.currentTab,
								});
							}
						} else {
							newSocketPositions.set(socketId, {
								...existingSocketPosition,
							});
						}
					}

					newCollaborators.set(userId, {
						...existingCollaborator,
						sockets: newSocketPositions,
					});
				}
				return newCollaborators;
			});
		}

		function onUsersInRoomChange({ roomState }: UsersInRoomChangePayload) {
			console.log("users-in-room-chage: ", roomState);
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
					const hasEditingRights = roomState.currentEditingUser
						? roomState.currentEditingUser === user.userId
						: false;
					const newSocketPositions: Map<string, SocketPosition> = new Map();

					if (!existingCollaborator) {
						for (const socketId of user.socketIds) {
							newSocketPositions.set(socketId, { socketId });
						}
					} else {
						for (const socketId of user.socketIds) {
							const existingSocketPosition =
								existingCollaborator.sockets.get(socketId);
							if (existingSocketPosition) {
								newSocketPositions.set(socketId, { ...existingSocketPosition });
							} else {
								newSocketPositions.set(socketId, { socketId });
							}
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

		function onInitializeConceptualModel(
			payload: InitializeConceptualModelPayload
		) {
			console.log("Initial State: ", payload);
			reset(payload.conceptualModel);
			setIsModelInitialized(true);
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

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("field-update", onFieldUpdate);
		socket.on("item-added-to-list", onItemAddedToList);
		socket.on("item-removed-from-list", onItemRemovedFromList);
		socket.on("server-volatile-broadcast", onServerVolatileBroadcast);
		socket.on(
			SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL,
			onInitializeConceptualModel
		);
		socket.on(SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE, onUsersInRoomChange);

		return () => {
			socket.off("connect", onConnect);
			socket.off("field-update", onFieldUpdate);
			socket.off("disconnect", onDisconnect);
			socket.off("item-added-to-list", onItemAddedToList);
			socket.off("item-removed-from-list", onItemRemovedFromList);
			socket.off("server-volatile-broadcast", onServerVolatileBroadcast);
			socket.off(
				SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL,
				onInitializeConceptualModel
			);
			socket.off(
				SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE,
				onUsersInRoomChange
			);
			socket.disconnect();
		};
	}, [session?.auth]);

	const sendPropertyUpdate = (value: any, propertyPath: string) => {
		if (!hasEditingRights) return;
		socket.emit("field-update", { roomId, propertyPath, value }); // Emit partial form data
	};

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
		itemType: "assumption" | "simplification" | "entity";
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

	const customRegisterField = ({
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
			onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
				// Call the original onChange handler
				registerResult.onChange(e);

				if (propagateUpdateOnChange) {
					const value = getValues(e.currentTarget.name as any);
					sendPropertyUpdate(value, propertyPath);
				}
			},
			onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
				// Call the original onBlur handler
				registerResult.onBlur(e);

				if (!propagateUpdateOnChange) {
					const value = getValues(e.currentTarget.name as any);
					sendPropertyUpdate(value, propertyPath);
				}
			},
			readOnly: !hasEditingRights,
		};

		return enhancedRegister;
	};

	return (
		<div className="flex-grow" onMouseMove={handleMouseMove}>
			<p>Dashboard Page</p>
			<div className="flex flex-col absolute top-0 right-0 ">
				<Button
					disabled={!canUserSendEditingRequest}
					onClick={handleRequestEditingRights}
				>
					Solicitar el Permiso de Edición
				</Button>
				<p>Pending Requests:</p>
				{pendingEditingRequests
					.filter((r): r is ActiveEditingRequest => r.status === "pending")
					.filter((r) => collaborators.get(r.requesterUserId))
					.map((r) => {
						return (
							<EditingRequestNotification
								key={r.requestId}
								request={r}
								collaborator={collaborators.get(r.requesterUserId)!}
								{...{ handleEditingRequestEvaluation }}
							/>
						);
					})}
			</div>
			<p>Status: {isConnected ? "connected" : "disconnected"}</p>
			<p>Id: {isConnected ? socket.id : "No disponible"}</p>
			<p>Transport: {transport}</p>
			<p>Current Room: {roomId}</p>
			<h1>Collaborators:</h1>
			<ul>
				{Array.from(collaborators.values()).map((collaborator) => {
					return (
						<li className="ml-5" key={collaborator.userId}>
							<p>
								- User: {collaborator.userId} - Can Edit:{" "}
								{collaborator.hasEditingRights.toString()}
							</p>
							<p>
								{collaborator.name} {collaborator.lastName} -{" "}
								{collaborator.email}
							</p>
							<p>Sockets:</p>
							<ul>
								{Array.from(collaborator.sockets.values()).map((socket) => {
									return (
										<li className="ml-5" key={socket.socketId}>
											<p>Socket: {socket.socketId}</p>
											{socket.currentTab ? (
												<p className="ml-5">Current Tab: {socket.currentTab}</p>
											) : (
												<p className="ml-5"> Current Tab not available</p>
											)}
											{socket.mousePosition ? (
												<p className="ml-5">
													{" "}
													Mouse Position: X: {
														socket.mousePosition.relativeX
													} Y: {socket.mousePosition.relativeY}
												</p>
											) : (
												<p className="ml-5"> Mouse Position not available</p>
											)}
										</li>
									);
								})}
							</ul>
							<br />
						</li>
					);
				})}
			</ul>
			{!isModelInitialized ? (
				<p>Loading Model</p>
			) : (
				<form className="flex flex-col">
					<br />
					<Tabs
						orientation="vertical"
						value={currentTab}
						onValueChange={handleCurrentTabChange}
						defaultValue="objetivo-suposiciones"
					>
						<TabsList className="flex-col h-auto items-stretch">
							<TabsTrigger value="objetivo-suposiciones">
								Objetivo y Suposiciones
							</TabsTrigger>
							<TabsTrigger value="diagrama-estructura-entidades">
								Diagrama de Estructura
							</TabsTrigger>
							<TabsTrigger value="entidades-diagramas-dinamica">
								Entidades y Diagramas Dinámica
							</TabsTrigger>
						</TabsList>
						<TabsContent value="objetivo-suposiciones">
							<input {...customRegisterField({ name: "objective" })} />
							<h2>Suposiciones</h2>
							<button
								disabled={!hasEditingRights}
								onClick={(e) =>
									handleAddItemToList({
										e,
										listPropertyPath: "assumptions",
										itemType: "assumption",
									})
								}
							>
								Agregar Suposición
							</button>
							<ul>
								{assumptionList.fields.map((field, index) => {
									return (
										<li key={field.id}>
											<label>
												{`Assumption Id: ${field._id}`} - Description:
											</label>
											<input
												{...customRegisterField({
													name: `assumptions.${index}.description`,
													propertyPath: `assumptions:${field._id}.description`,
												})}
											/>
											<button
												disabled={!hasEditingRights}
												onClick={(e) =>
													handleRemoveItemFromList({
														e,
														listPropertyPath: "assumptions",
														itemId: field._id,
													})
												}
											>
												Delete
											</button>
										</li>
									);
								})}
							</ul>
							<h2>Simplificaciones</h2>
							<button
								disabled={!hasEditingRights}
								onClick={(e) =>
									handleAddItemToList({
										e,
										listPropertyPath: "simplifications",
										itemType: "simplification",
									})
								}
							>
								Agregar Simplificacion
							</button>
							<ul>
								{simplificationList.fields.map((field, index) => {
									return (
										<li key={field.id}>
											<label>
												{`Simplification Id: ${field._id}`} - Description:
											</label>
											<input
												{...customRegisterField({
													name: `simplifications.${index}.description`,
													propertyPath: `simplifications:${field._id}.description`,
												})}
											/>
											<button
												disabled={!hasEditingRights}
												onClick={(e) =>
													handleRemoveItemFromList({
														e,
														listPropertyPath: "simplifications",
														itemId: field._id,
													})
												}
											>
												Delete
											</button>
										</li>
									);
								})}
							</ul>
						</TabsContent>
					</Tabs>

					<h2>Diagrama de Estructura</h2>
					<Diagram
						{...{
							register: customRegisterField,
							watch,
							namePrefix: "structureDiagram",
							propertyPathPrefix: "structureDiagram",
						}}
					/>
					<h2>Entidades</h2>
					<button
						disabled={!hasEditingRights}
						onClick={(e) =>
							handleAddItemToList({
								e,
								listPropertyPath: "entities",
								itemType: "entity",
							})
						}
					>
						Agregar Entidad
					</button>
					<ul>
						{entitiesList.fields.map((field, index) => {
							return (
								<li key={field.id}>
									<label>{`Entity Id: ${field._id}`} - Nombre:</label>
									<input
										{...customRegisterField({
											name: `entities.${index}.name`,
											propertyPath: `entities:${field._id}.name`,
										})}
									/>
									<button
										disabled={!hasEditingRights}
										onClick={(e) =>
											handleRemoveItemFromList({
												e,
												listPropertyPath: "entities",
												itemId: field._id,
											})
										}
									>
										Delete
									</button>
								</li>
							);
						})}
					</ul>
				</form>
			)}
		</div>
	);
}
