"use client";
import { useState, useEffect, useCallback } from "react";
import {
	getPendingVerifierRequests,
	getFinalizedVerifierRequests,
} from "@components/dashboard/verification-requests/actions/get-verification-requests";
import type {
	PendingVerifierRequest,
	FinalizedVerifierRequest,
} from "#types/verification-request";

export const useVerificationRequests = () => {
	const [pendingRequests, setPendingRequests] = useState<PendingVerifierRequest[]>([]);
	const [finalizedRequests, setFinalizedRequests] = useState<FinalizedVerifierRequest[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAll = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const [pendingRes, finalizedRes] = await Promise.all([
				getPendingVerifierRequests(),
				getFinalizedVerifierRequests(),
			]);
			if (pendingRes.data?.verifierRequests) {
				setPendingRequests(pendingRes.data.verifierRequests);
			} else {
				setPendingRequests([]);
			}
			if (finalizedRes.data?.verifierRequests) {
				setFinalizedRequests(finalizedRes.data.verifierRequests);
			} else {
				setFinalizedRequests([]);
			}
			if (pendingRes.error) setError(pendingRes.error);
			if (finalizedRes.error && !pendingRes.error) setError(finalizedRes.error);
		} catch (err) {
			setError("Error al cargar las solicitudes de verificación.");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAll();
	}, [fetchAll]);

	return {
		pendingRequests,
		finalizedRequests,
		isLoading,
		error,
		refreshVerificationRequests: fetchAll,
	};
};
