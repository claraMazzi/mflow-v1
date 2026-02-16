import { Path, RegisterOptions } from "react-hook-form";
import { ConceptualModel, ImageInfo, Version } from "./conceptual-model";
import { ChangeEvent } from "react";

export type CustomRegisterFieldFn = ({
  name,
  propertyPath,
  options,
  propagateUpdateOnChange,
}: {
  name: Path<ConceptualModel>;
  propertyPath?: string;
  options?: RegisterOptions<ConceptualModel, Path<ConceptualModel>>;
  propagateUpdateOnChange?: boolean;
}) => {
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  readOnly: boolean;
  name: Path<ConceptualModel>;
  ref: (instance: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null) => void;
};

//mover a #types
export type BaseSocketEventPayload = { type: string; timestamp: Date };

export enum CLIENT_WS_EVENT_TYPES {
	JOIN_ROOM = "join-room",
}

export type JoinRoomEventPayload = BaseSocketEventPayload & {
	type: CLIENT_WS_EVENT_TYPES.JOIN_ROOM;
	roomId: string;
};

export type UsersInRoomChangePayload = BaseSocketEventPayload & {
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

export type InitializeConceptualModelPayload = BaseSocketEventPayload & {
	type: SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL;
	version: Version & { projectTitle?: string; ownerName?: string };
	imageInfos: (Omit<ImageInfo, "uploadedAt"> & { createdAt: string })[];
};

export enum SERVER_WS_EVENT_TYPES {
	FIRST_IN_ROOM = "first-in-room",
	USERS_IN_ROOM_CHANGE = "users-in-room-change",
	INITIALIZE_CONCEPTUAL_MODEL = "initialize-conceptual-model",
}

export type SocketPosition = Readonly<{
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
