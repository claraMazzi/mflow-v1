"use client";

import { useEffect, useState, MouseEvent, FocusEvent, useRef } from "react";
import { io } from "socket.io-client";
import { socket } from "../../socket";
import { lightningCssTransform } from "next/dist/build/swc/generated-native";
import { set } from "zod";
import { useFieldArray, useForm } from "react-hook-form";

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

type Diagram = {
	usesPlantText: boolean;
	plantTextCode: string;
	imageFilePath: string;
};

type Property = {
	_id: string;
	nombre: string;
	detailLevelDecision: {
		include: boolean;
		justification: string;
		argumentType: "CALCULO SALIDA" | "DATO DE ENTRADA" | "SIMPLIFICACION";
	};
};

type Entity = {
	_id: string;
	nombre: string;
	scopeDecision: {
		include: boolean;
		justification: string;
		argumentType:
			| "SALIDA"
			| "ENTRADA"
			| "NO VINCULADO A OBJETIVOS"
			| "SIMPLIFICACION";
	};
	dynamicDiagram: Diagram;
	properties: Property[];
};

type Input = {
	_id: string;
	description: string;
	entity: string;
	type: "PARAMETRO" | "FACTOR EXPERIMENTAL";
};

type Output = {
	_id: string;
	description: string;
	entity: string;
};

type Simplification = {
	_id: string;
	description: string;
};

type Assumption = {
	_id: string;
	description: string;
};

type ConceptualModel = {
	objective: string;
	simplifications: Simplification[];
	assumptions: Assumption[];
	structureDiagram: Diagram;
	flowDiagram: Diagram;
	inputs: Input[];
	outputs: Output[];
	entities: Entity[];
};

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

const MOUSE_POSITION_UPDATE_DELAY = 33; //30 fps

export default function Page() {
	const [isModelInitialized, setIsModelInitialized] = useState(false);

	const {
		register,
		control,
		setValue,
		getValues,
		reset,
		formState: { errors },
	} = useForm<ConceptualModel>();
	const fields = useFieldArray({ name: "simplifications", control });

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
	const [username, setUsername] = useState("");

	useEffect(() => {
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
			if (!socket.id) return;
			const newCollaborators = new Map<string, Collaborator>();
			newCollaborators.set(socket.id, {
				socketId: socket.id,
				isCurrentUser: true,
				hasEditingRights: true,
			});
			setCollaborators(newCollaborators);
		}

		function onFieldUpdate(payload: { fieldName: any; value: any }) {
			console.log(`Server Sent Update ${payload.fieldName}: ${payload.value}`);
			setValue(payload.fieldName, payload.value);
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

		socket.on("connect", onConnect);
		socket.on("field-update", onFieldUpdate);
		socket.on("disconnect", onDisconnect);
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
	}, []);

	const handleOnFieldBlur = (e: FocusEvent<HTMLInputElement>) => {
		const value = getValues(e.currentTarget.name as any);
		socket.emit("field-update", { roomId, fieldName: e.target.name, value }); // Emit partial form data
	};

	const handleMouseMove = (e: MouseEvent) => {
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

	const handleAddItemToList = (e: MouseEvent) => {};

	return (
		<div className="flex-grow" onMouseMove={handleMouseMove}>
			<p>Dashboard Page</p>
			<p>Status: {isConnected ? "connected" : "disconnected"}</p>
			<p>Id: {isConnected ? socket.id : "No disponible"}</p>
			<p>Transport: {transport}</p>
			<p>Current Room: {roomId}</p>
			<p>Current Username: {username}</p>
			<h1>Collaborators:</h1>
			<ul>
				{Array.from(collaborators.values()).map((collaborator) => {
					return (
						<li key={collaborator.socketId}>
							<p>
								{collaborator.socketId} - {collaborator.userId}
							</p>
							{collaborator.mousePosition ? (
								<p>
									X: {collaborator.mousePosition.relativeX} Y:{" "}
									{collaborator.mousePosition.relativeY}
								</p>
							) : (
								<p> Mouse Position no available</p>
							)}
						</li>
					);
				})}
			</ul>
			{!isModelInitialized ? (
				<p>Loading Model</p>
			) : (
				<form>
					<input
						{...register("objective", { required: true })}
						onBlur={(e) => {
							register("objective").onBlur(e); // RHF handler
							handleOnFieldBlur(e); // Your custom handler
						}}
					/>
					<input
						{...register("structureDiagram.imageFilePath")}
						onBlur={(e) => {
							register("structureDiagram.imageFilePath").onBlur(e); // RHF handler
							handleOnFieldBlur(e); // Your custom handler
						}}
					/>
				</form>
			)}
		</div>
	);
}
