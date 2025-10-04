import { useState, useMemo, useCallback, useEffect } from "react";
import { Socket } from "@node_modules/socket.io-client/build/esm";

export type EditingRequest =
	| {
			requestId: null;
			requesterUserId: string;
			status: "sent";
			timeoutStartTimestamp: null;
	  }
	| {
			requestId: string;
			requesterUserId: string;
			status: "pending" | "accepted" | "declined";
			timeoutStartTimestamp: number;
	  };

export type ActiveEditingRequest = Extract<
	EditingRequest,
	{ status: "pending" | "accepted" | "declined" }
>;

export function useEditingRequests({
	roomId,
	socket,
	userId,
	hasEditingRights,
}: {
	roomId: string;
	socket: Socket;
	userId: string | undefined;
	hasEditingRights: boolean;
}) {
	const [outgoingRequest, setOutgoingRequest] = useState<EditingRequest | null>(
		null
	);
	const [pendingEditingRequests, setPendingEditingRequests] = useState<
		EditingRequest[]
	>([]);

	const canUserSendEditingRequest = useMemo(() => {
		return !hasEditingRights && !outgoingRequest;
	}, [hasEditingRights, outgoingRequest]);

	const handleRequestEditingRights = useCallback(() => {
		if (!userId) return;
		if (!canUserSendEditingRequest) return;
		setOutgoingRequest({
			status: "sent",
			requesterUserId: userId,
			requestId: null,
			timeoutStartTimestamp: null,
		});
		socket.emit("request-editing-privilege", { roomId });
	}, [canUserSendEditingRequest, roomId, userId]);
	

	const handleEditingRequestEvaluation = useCallback(
		({
			requestId,
			action,
		}: {
			requestId: string;
			action: "accept" | "decline";
		}) => {
			return () => {
				if (!userId) return;
				if (!hasEditingRights) return;
				let eventName: string;
				let newStatus: "accepted" | "declined";
				const isRequestPresent = pendingEditingRequests.some(
					(r) => requestId === r.requestId
				);
				if (!isRequestPresent) return;
				switch (action) {
					case "accept":
						eventName = "accept-editing-request";
						newStatus = "accepted";
						break;
					case "decline":
						eventName = "decline-editing-request";
						newStatus = "declined";
						break;
				}
				setPendingEditingRequests((prev) => {
					return prev.map((r) => {
						if (r.requestId === requestId) {
							return { ...r, status: newStatus };
						} else {
							return r;
						}
					})}
				);
				
				socket.emit(eventName, { roomId, requestId });
			};
		},
		[
			userId,
			roomId,
			hasEditingRights,
			pendingEditingRequests,
			setPendingEditingRequests,
		]
	);

	const handleCollaboratorsChange = useCallback(
		({
			hasEditorChanged,
			collaboratorUserIds,
		}: {
			hasEditorChanged: boolean;
			collaboratorUserIds: Set<string>;
		}) => {
			if (hasEditorChanged) {
				setOutgoingRequest(null);
				setPendingEditingRequests([]);
				return;
			}
			if (hasEditingRights) {
				setPendingEditingRequests((prev) => {
					return prev.filter((r) => collaboratorUserIds.has(r.requesterUserId));
				});
			}
		},
		[hasEditingRights, setOutgoingRequest, setPendingEditingRequests]
	);

	const onEditingRequestStarted = useCallback(
		({
			requestId,
			timeoutStartTimestamp,
			requesterUserId,
			editorUserId,
		}: {
			requestId: string;
			timeoutStartTimestamp: number;
			requesterUserId: string;
			editorUserId: string;
		}) => {
			if (!userId) return;
			if (hasEditingRights) {
				if (editorUserId !== userId) return;
				setPendingEditingRequests([
					...pendingEditingRequests,
					{
						requesterUserId,
						requestId,
						status: "pending",
						timeoutStartTimestamp,
					},
				]);
			} else {
				if (requesterUserId !== userId) return;
				setOutgoingRequest({
					status: "pending",
					requesterUserId,
					requestId,
					timeoutStartTimestamp,
				});
			}
		},
		[
			userId,
			hasEditingRights,
			pendingEditingRequests,
			setOutgoingRequest,
			setPendingEditingRequests,
		]
	);

	const onEditingRequestCreationRefused = useCallback(() => {
		setOutgoingRequest(null);
	}, [setOutgoingRequest]);

	const onEditingRequestUpdateFailed = useCallback(
		({ requestId }: { requestId: string }) => {
			if (!userId) return;
			if (!hasEditingRights) return;
			setPendingEditingRequests(
				pendingEditingRequests.map((r) => {
					if (r.requestId === requestId) {
						return { ...r, status: "pending" };
					} else {
						return r;
					}
				})
			);
		},
		[
			userId,
			hasEditingRights,
			pendingEditingRequests,
			setPendingEditingRequests,
		]
	);

	const onEditingRequestUpdated = useCallback(
		({ requestId }: { requestId: string }) => {
			if (!userId) return;
			if (hasEditingRights) {
				setPendingEditingRequests(
					pendingEditingRequests.filter((r) => r.requestId !== requestId)
				);
			} else {
				if (!outgoingRequest?.requestId) return;
				if (outgoingRequest.requestId !== requestId) return;
				setOutgoingRequest(null);
			}
		},
		[
			userId,
			hasEditingRights,
			outgoingRequest,
			setOutgoingRequest,
			pendingEditingRequests,
			setPendingEditingRequests,
		]
	);

	useEffect(() => {
		socket.on("editing-request-started", onEditingRequestStarted);
		socket.on(
			"editing-request-creation-refused",
			onEditingRequestCreationRefused
		);
		socket.on("editing-request-refusal-failed", onEditingRequestUpdateFailed);
		socket.on("editing-request-approval-failed", onEditingRequestUpdateFailed);
		socket.on("editing-request-approved", onEditingRequestUpdated);
		socket.on("editing-request-declined", onEditingRequestUpdated);

		return () => {
			socket.off("editing-request-started", onEditingRequestStarted);
			socket.off(
				"editing-request-creation-refused",
				onEditingRequestCreationRefused
			);
			socket.off(
				"editing-request-refusal-failed",
				onEditingRequestUpdateFailed
			);
			socket.off(
				"editing-request-approval-failed",
				onEditingRequestUpdateFailed
			);
			socket.off("editing-request-approved", onEditingRequestUpdated);
			socket.off("editing-request-declined", onEditingRequestUpdated);
		};
	}, [
		onEditingRequestStarted,
		onEditingRequestUpdated,
		onEditingRequestCreationRefused,
		onEditingRequestUpdateFailed,
	]);

	return {
		canUserSendEditingRequest,
		pendingEditingRequests,
		handleCollaboratorsChange,
		handleEditingRequestEvaluation,
		handleRequestEditingRights,
	};
}
