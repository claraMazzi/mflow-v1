"use client";

import { FormEventHandler, use, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { socket } from "../../socket";
import { lightningCssTransform } from "next/dist/build/swc/generated-native";
import { set } from "zod";

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
}>;

export default function Page() {
	const [isConnected, setIsConnected] = useState(false);
	const [transport, setTransport] = useState("N/A");

	const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(
		new Map()
	);
	const [roomId, setRoomId] = useState("67d8321cd76cf5bc5bd75c79");
	const [username, setUsername] = useState("");

	const [messages, setMessages] = useState<string[]>([]);
	const [message, setMessage] = useState("");

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

		function onMessage(data: string) {
			console.log(messages);
			console.log(data);
			setMessages((prevMessages) => [...prevMessages, data]);
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
			console.log(payload);
		}

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("message", onMessage);
		socket.on(
			SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL,
			onInitializeConceptualModel
		);
		socket.on(SERVER_WS_EVENT_TYPES.FIRST_IN_ROOM, onFirstInRoom);
		socket.on(SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE, onUsersInRoomChange);

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("message", onMessage);
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

	const handleOnSendMessage = (e: any) => {
		e.preventDefault();
		socket.emit("message", message);
		setMessage("");
	};

	return (
		<div className="h-full">
			<p>Dashboard Page</p>
			<p>Status: {isConnected ? "connected" : "disconnected"}</p>
			<p>Id: {isConnected ? socket.id : "No disponible"}</p>
			<p>Transport: {transport}</p>
			<p>Current Room: {roomId}</p>
			<p>Current Username: {username}</p>
			<h1>Collaborators:</h1>
			<ul>
				{Array.from(collaborators.values()).map((collaborator) => {
					return <li key={collaborator.socketId}>{collaborator.socketId}</li>;
				})}
			</ul>
			<form onSubmit={handleOnSendMessage}>
				<input
					type="text"
					placeholder="Your message"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
				/>
				<button>Send</button>
			</form>
			<ul>
				{messages.map((m, index) => (
					<li key={index}>{m}</li>
				))}
			</ul>
		</div>
	);
}
