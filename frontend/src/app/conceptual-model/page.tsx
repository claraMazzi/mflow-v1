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

type BaseSocketEventPayload = { type: string; timestamp: Date };

enum CLIENT_WS_EVENT_TYPES {
	JOIN_ROOM = "join-room",
}

type JoinRoomEventPayload = BaseSocketEventPayload & {
	type: CLIENT_WS_EVENT_TYPES.JOIN_ROOM;
	roomId: string;
	username: string;
};

type FirstInRoomPayload = BaseSocketEventPayload & {
	type: SERVER_WS_EVENT_TYPES.FIRST_IN_ROOM;
};

type UsersInRoomChangePayload = BaseSocketEventPayload & {
	type: SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE;
	socketsInRoom: string[];
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

type Collaborator = Readonly<{
	socketId: string;
	userId?: string;
	isCurrentUser: boolean;
	hasEditingRights: boolean;
	mousePosition?: { relativeX: number; relativeY: number };
	currentTab?: string;
}>;

//t1 -> U1 S devuelve un token que tiene el timestamp de inicio de la request
//t2 -> U1 -> Envia el token y con eso el servidor compara

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

function parsePropertyPath(conceptualModel: any, path: string) {
	const pathParts = path.split(".");
	for (let i = 0; i < pathParts.length - 1; i++) {
		if (Array.isArray(conceptualModel[pathParts[i]])) {
			pathParts[i + 1] = conceptualModel[pathParts[i]].findIndex(
				(e: any) => e._id === pathParts[i + 1]
			);
		}
		conceptualModel = conceptualModel[pathParts[i]];
	}
	return pathParts.join(".");
}

const MOUSE_POSITION_UPDATE_DELAY = 33; //30 fps

export default function Page() {
	const [isModelInitialized, setIsModelInitialized] = useState(false);
	const { data: session } = useSession();
	
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

	console.log(getValues());

	const [isConnected, setIsConnected] = useState(false);
	const [transport, setTransport] = useState("N/A");
	const throttledEmitMouseUpdateFunction = useRef(
		throttle((roomId: any, mousePosition: any) => {
			socket.volatile.emit("client-volatile-broadcast", {
				roomId,
				userId: "ignored",
				mousePosition: mousePosition,
				type: "mouse-position-change",
				timestamp: new Date(),
			});
		}, MOUSE_POSITION_UPDATE_DELAY)
	);

	const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(
		new Map()
	);
	const [roomId, setRoomId] = useState("67d8321cd76cf5bc5bd75c79");
	const canUserEdit = useMemo(() => {
		if(!socket.id) return false;
		return !!collaborators.get(socket.id)?.hasEditingRights;
	}, [collaborators]);

	useEffect(() => {
		
		if(!session) {
			socket.disconnect();
		} else {
			socket.auth = {
				sessionToken: session.auth
			};
			socket.connect();
		}
		
		if (socket.connected) {
			onConnect();
		}

		function onConnect() {
			setIsConnected(true);
			setTransport(socket.io.engine.transport.name);

			socket.io.engine.on("upgrade", (transport) => {
				setTransport(transport.name);
			});
			socket.emit(CLIENT_WS_EVENT_TYPES.JOIN_ROOM, {
				type: CLIENT_WS_EVENT_TYPES.JOIN_ROOM,
				username: "ignored",
				roomId: roomId,
				timestamp: new Date(),
			} satisfies JoinRoomEventPayload);
		}

		function onDisconnect() {
			setIsConnected(false);
			setTransport("N/A");
		}

		function onFirstInRoom(payload: FirstInRoomPayload) {
			if(!socket.id) return;
			const newCollaborators = new Map<string, Collaborator>();
			newCollaborators.set(socket.id, {
				socketId: socket.id,
				userId: "ignored",
				isCurrentUser: true,
				hasEditingRights: true,
			});
			setCollaborators(newCollaborators);
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
			mousePosition: { relativeX: number; relativeY: number };
			type: string;
			timestamp: Date;
		}) {
			setCollaborators((prevCollaborators) => {
				const newCollaborators = new Map<string, Collaborator>();
				for (const socketId of prevCollaborators.keys()) {
					const existingCollaborator = prevCollaborators.get(socketId);

					if (!existingCollaborator) continue;

					if (socketId === payload.socketId) {
						newCollaborators.set(socketId, {
							...existingCollaborator,
							userId: payload.userId,
							mousePosition: payload.mousePosition,
						});
					} else {
						newCollaborators.set(socketId, { ...existingCollaborator });
					}
				}
				return newCollaborators;
			});
		}

		function onUsersInRoomChange(payload: UsersInRoomChangePayload) {
			setCollaborators((prevCollaborators) => {
				const newCollaborators = new Map<string, Collaborator>();
				for (const socketId of payload.socketsInRoom) {
					const existingCollaborator = prevCollaborators.get(socketId);

					if (existingCollaborator) {
						newCollaborators.set(socketId, { ...existingCollaborator });
					} else {
						newCollaborators.set(socketId, {
							socketId: socketId,
							isCurrentUser: socketId === socket.id,
							hasEditingRights: false,
						});
					}
				}
				return newCollaborators;
			});
		}

		function onInitializeConceptualModel(
			payload: InitializeConceptualModelPayload
		) {
			console.log("Initial State: ", payload);
			reset(payload.conceptualModel);
			setIsModelInitialized(true);
		}

		function onItemAddedToList<K extends keyof ConceptualModel>({
			listPropertyPath,
			newItem,
		}: {
			listPropertyPath: string;
			newItem: any;
		}) {
			const parsedPath: any = parsePropertyPath(getValues, listPropertyPath);
			setValue(parsedPath, [...getValues(parsedPath), newItem]);
		}

		function onItemRemovedFromList<K extends keyof ConceptualModel>({
			listPropertyPath,
			itemId,
		}: {
			listPropertyPath: Path<ConceptualModel>;
			itemId: string;
		}) {
			const parsedPath: any = parsePropertyPath(getValues, listPropertyPath);
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
		socket.on(SERVER_WS_EVENT_TYPES.FIRST_IN_ROOM, onFirstInRoom);
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
			socket.off(SERVER_WS_EVENT_TYPES.FIRST_IN_ROOM, onFirstInRoom);
			socket.off(
				SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE,
				onUsersInRoomChange
			);
		};
	}, [session]);

	const sendPropertyUpdate = (value: any, propertyPath: string) => {
		if (!canUserEdit) return;
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

		throttledEmitMouseUpdateFunction.current(roomId, mousePosition);
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

	const handleFileUpload = ({
		file,
		propertyPath,
	}: {
		file: File;
		propertyPath: string;
	}) => {
		console.log("Uploading File: ", file);
		const fileExtension = file.name.split(".").pop();
		socket.emit("upload-file", { roomId, file, propertyPath, fileExtension });
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
			readOnly: !canUserEdit,
		};

		return enhancedRegister;
	};

	return (
		<div className="flex-grow" onMouseMove={handleMouseMove}>
			<p>Dashboard Page</p>
			<p>Status: {isConnected ? "connected" : "disconnected"}</p>
			<p>Id: {isConnected ? socket.id : "No disponible"}</p>
			<p>Transport: {transport}</p>
			<p>Current Room: {roomId}</p>
			<h1>Collaborators:</h1>
			<ul>
				{Array.from(collaborators.values()).map((collaborator) => {
					return (
						<li key={collaborator.socketId}>
							<p>
								{collaborator.socketId} - {collaborator.userId} - Can Edit:{" "}
								{collaborator.hasEditingRights.toString()}
							</p>
							{collaborator.mousePosition ? (
								<p>
									X: {collaborator.mousePosition.relativeX} Y:{" "}
									{collaborator.mousePosition.relativeY}
								</p>
							) : (
								<p> Mouse Position not available</p>
							)}
						</li>
					);
				})}
			</ul>
			{!isModelInitialized ? (
				<p>Loading Model</p>
			) : (
				<form className="flex flex-col">
					<input
						{...customRegisterField({ name: "structureDiagram.imageFilePath" })}
					/>
					<br />
					<Tabs orientation="vertical" defaultValue="objetivo-suposiciones">
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
								disabled={!canUserEdit}
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
													propertyPath: `assumptions.${field._id}.description`,
												})}
											/>
											<button
												disabled={!canUserEdit}
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
								disabled={!canUserEdit}
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
													propertyPath: `simplifications.${field._id}.description`,
												})}
											/>
											<button
												disabled={!canUserEdit}
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
							handleFileUpload,
						}}
					/>
					<h2>Entidades</h2>
					<button
						disabled={!canUserEdit}
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
											propertyPath: `entities.${field._id}.name`,
										})}
									/>
									<button
										disabled={!canUserEdit}
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
