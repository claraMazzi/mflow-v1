import { useState, useMemo, useCallback, useEffect, use } from "react";
import { Socket } from "@node_modules/socket.io-client/build/esm";
import { boolean, string } from "@node_modules/zod";
import { Session } from "next-auth";

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
	session,
	hasEditingRights,
}: {
	roomId: string;
	socket: Socket;
	session: Session | null;
	hasEditingRights: boolean;
}) {
	const [outgoingRequest, setOutGoingRequest] = useState<EditingRequest | null>(
		null
	);
	const [pendingEditingRequests, setPendingEditingRequests] = useState<
		EditingRequest[]
	>([]);

	const canUserSendEditingRequest = useMemo(() => {
		return !hasEditingRights && !outgoingRequest;
	}, [hasEditingRights, outgoingRequest]);

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
			if (!session) return;
			if (hasEditingRights) {
				if (editorUserId !== session.user.id) return;
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
				if (requesterUserId !== session.user.id) return;
				setOutGoingRequest({
					status: "pending",
					requesterUserId,
					requestId,
					timeoutStartTimestamp,
				});
			}
		},
		[
			session,
			hasEditingRights,
			pendingEditingRequests,
			setOutGoingRequest,
			setPendingEditingRequests,
		]
	);

	const onEditingRequestCreationRefused = useCallback(() => {
		setOutGoingRequest(null);
	}, [setOutGoingRequest]);

	const handleRequestEditingRights = useCallback(() => {
		if (!session) return;
		if (!canUserSendEditingRequest) return;
		setOutGoingRequest({
			status: "sent",
			requesterUserId: session.user.id,
			requestId: null,
			timeoutStartTimestamp: null,
		});
		socket.emit("request-editing-privilege", { roomId });
	}, [canUserSendEditingRequest, roomId, session]);

	const handleEditingRequestEvaluation = useCallback(
		({
			requestId,
			action,
		}: {
			requestId: string;
			action: "accept" | "decline";
		}) => {
			return () => {
				if (!hasEditingRights) return;
				const isRequestPresent = pendingEditingRequests.some(
					(r) => requestId === r.requestId
				);
				if (!isRequestPresent) return;
				let eventName: string;
				let newStatus: "accepted" | "declined";
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
				setPendingEditingRequests(
					pendingEditingRequests.map((r) => {
						if (r.requestId === requestId) {
							return { ...r, status: newStatus };
						} else {
							return r;
						}
					})
				);
				socket.emit(eventName, { roomId, requestId });
			};
		},
		[
			roomId,
			hasEditingRights,
			pendingEditingRequests,
			setPendingEditingRequests,
		]
	);

	const onEditingRequestUpdateFailed = useCallback(
		({ requestId }: { requestId: string }) => {
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
		[pendingEditingRequests, setPendingEditingRequests]
	);

	const onEditingRequestUpdated = useCallback(() => {
		
	}, []);

	useEffect(() => {
		socket.on("editing-request-started", onEditingRequestStarted);
		socket.on(
			"editing-request-creation-refused",
			onEditingRequestCreationRefused
		);
		socket.on("editing-request-refusal-failed", onEditingRequestUpdateFailed);
		socket.on("editing-request-approval-failed", onEditingRequestUpdateFailed);
		socket.on("editing-request-approved", onEditingRequestUpdated);
		socket.on("editing-request-refused", onEditingRequestUpdated);

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
			socket.off("editing-request-refused", onEditingRequestUpdated);
		};
	}, [
		onEditingRequestStarted,
		onEditingRequestCreationRefused,
		onEditingRequestUpdateFailed,
	]);

	return {
		canUserSendEditingRequest,
		pendingEditingRequests,
		handleEditingRequestEvaluation,
		handleRequestEditingRights,
	};
}
