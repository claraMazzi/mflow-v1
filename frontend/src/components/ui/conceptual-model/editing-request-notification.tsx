import { Collaborator } from "#types/collaboration";
import {
	ActiveEditingRequest,
} from "@hooks/use-request-editing-rights";
import { Button } from "../common/button";
import { useEffect, useState } from "react";
import { useUI } from "../context";

export default function EditingRequestNotification({
	request,
	collaborator,
	handleEditingRequestEvaluation,
}: {
	request: ActiveEditingRequest;
	collaborator: Collaborator;
	handleEditingRequestEvaluation: ({
		requestId,
		action,
	}: {
		requestId: string;
		action: "accept" | "decline";
	}) => () => void;
}) {
	const [remainingTimeoutSeconds, setRemainingTimeoutSeconds] = useState(10);
	const { closeModal } = useUI();

	useEffect(() => {
		const updateCountdown = () => {
			const elapsedTime = Date.now() - request.timeoutStartTimestamp;
			const remainingTime = Math.max(
				0,
				Math.ceil((10 * 1000 - elapsedTime) / 1000)
			);
			setRemainingTimeoutSeconds(remainingTime);
			return remainingTime;
		};

		updateCountdown();

		const intervalId = setInterval(() => {
			const remainingTime = updateCountdown();
			if (remainingTime === 0){
			closeModal();
				
				clearInterval(intervalId);}
		}, 1000);

		return () => {
			clearInterval(intervalId);
		};
	}, [request, setRemainingTimeoutSeconds]);

	return (
		<div className="max-w-40">
			<p>Request Id: {request.requestId}</p>
			<p>
				{`El colaborador ${collaborator.email} quiere editar el documento. Tiene ${remainingTimeoutSeconds} segundos para responder.`}
			</p>
			<div className="flex">
				<Button
					onClick={handleEditingRequestEvaluation({
						requestId: request.requestId!,
						action: "accept",
					})}
				>
					Aceptar
				</Button>
				<Button
					onClick={handleEditingRequestEvaluation({
						requestId: request.requestId!,
						action: "decline",
					})}
				>
					Rechazar
				</Button>
			</div>
		</div>
	);
}
