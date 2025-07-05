export class CollaborationRoom {
	private roomId: string;
	private socketIdsToUserIdsMap: Map<string, string>;
	private userIdWithEditingRights: string | null;

	constructor(roomId: string) {
		this.roomId = roomId;
		this.socketIdsToUserIdsMap = new Map();
		this.userIdWithEditingRights = null;
	}

	addPlayer(socketId: string, userId: string) {
		if (this.isEmpty()) {
			this.userIdWithEditingRights = userId;
		}
		this.socketIdsToUserIdsMap.set(socketId, userId);
	}

	isEmpty() {
		return this.socketIdsToUserIdsMap.size === 0;
	}
}
