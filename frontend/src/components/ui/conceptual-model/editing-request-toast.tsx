"use client"
import { useEffect, useState } from "react";
import { Collaborator } from "#types/collaboration";
import {
	ActiveEditingRequest,
} from "@hooks/use-request-editing-rights";
import { Button } from "../common/button";
import { X } from "lucide-react";

interface EditingRequestToastProps {
	request: ActiveEditingRequest;
	collaborator: Collaborator;
	handleEditingRequestEvaluation: ({
		requestId,
		action,
	}: {
		requestId: string;
		action: "accept" | "decline";
	}) => () => void;
	onClose: () => void;
}

export default function EditingRequestToast({
	request,
	collaborator,
	handleEditingRequestEvaluation,
	onClose,
}: EditingRequestToastProps) {
	const [remainingTimeoutSeconds, setRemainingTimeoutSeconds] = useState(10);
	const [progress, setProgress] = useState(100);

	useEffect(() => {
		const updateCountdown = () => {
			const elapsedTime = Date.now() - request.timeoutStartTimestamp;
			const remainingTime = Math.max(
				0,
				Math.ceil((10 * 1000 - elapsedTime) / 1000)
			);
			const progressPercentage = (remainingTime / 10) * 100;
			
			setRemainingTimeoutSeconds(remainingTime);
			setProgress(progressPercentage);
			
			return remainingTime;
		};

		updateCountdown();

		const intervalId = setInterval(() => {
			const remainingTime = updateCountdown();
			if (remainingTime === 0) {
				onClose();
				clearInterval(intervalId);
			}
		}, 1000);

		return () => {
			clearInterval(intervalId);
		};
	}, [request, onClose]);

	const handleAccept = () => {
		handleEditingRequestEvaluation({
			requestId: request.requestId!,
			action: "accept",
		})();
		onClose();
	};

	const handleDecline = () => {
		handleEditingRequestEvaluation({
			requestId: request.requestId!,
			action: "decline",
		})();
		onClose();
	};

	return (
		<div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-80 max-w-sm">
			{/* Header with title and close button */}
			<div className="flex items-center justify-between p-4 pb-2">
				<div className="flex items-center gap-2">
					<div className="w-2 h-2 bg-purple-600 rounded-full"></div>
					<h3 className="text-purple-600 font-medium text-sm">
						Solicitud del Permiso de Edición
					</h3>
				</div>
				<button
					onClick={onClose}
					className="text-gray-400 hover:text-gray-600 transition-colors"
				>
					<X className="w-4 h-4" />
				</button>
			</div>

			{/* Progress bar */}
			<div className="px-4 pb-2">
				<div className="w-full bg-gray-200 rounded-full h-1">
					<div
						className="bg-purple-600 h-1 rounded-full transition-all duration-1000 ease-linear"
						style={{ width: `${progress}%` }}
					></div>
				</div>
			</div>

			{/* Content */}
			<div className="p-4 pt-2">
				<h4 className="font-semibold text-gray-900 mb-2">
					Permiso de Edición
				</h4>
				<p className="text-gray-600 text-sm mb-4">
					{collaborator.email} quiere editar la versión del modelo. ¿Desea otorgar el permiso de edición?
				</p>
				<p className="text-xs text-gray-500 mb-4">
					Tiempo restante: {remainingTimeoutSeconds} segundos
				</p>

				{/* Action buttons */}
				<div className="flex gap-2">
					<Button
						onClick={handleDecline}
						variant="outline"
						className="flex-1 text-gray-600 border-gray-300 hover:bg-gray-50"
					>
						DENEGAR
					</Button>
					<Button
						onClick={handleAccept}
						className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
					>
						ACEPTAR
					</Button>
				</div>
			</div>
		</div>
	);
}
