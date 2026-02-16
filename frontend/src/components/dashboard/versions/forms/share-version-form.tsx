"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Button } from "@components/ui/common/button";
import { Input } from "@components/ui/common/input";
import { X, Link, UserPlus } from "lucide-react";
import QRCode from "qrcode";
import {
	getVersionSharingLink,
	sendVersionShareInvitation,
	removeReaderFromVersion,
	getVersionWithReaders,
	type VersionReader,
} from "../actions/share-version";
import { VersionEntity } from "#types/version";
import { useUI } from "@components/ui/context";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface ShareVersionFormProps {
	version: VersionEntity;
}

const initialState = {
	error: undefined,
	success: false,
};

export const ShareVersionForm = ({ version }: ShareVersionFormProps) => {
	const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
	const [shareLink, setShareLink] = useState<string>("");
	const [emailInput, setEmailInput] = useState<string>("");
	const [error, setError] = useState<string | undefined>();
	const { data: session } = useSession();
	const [newReaders, setNewReaders] = useState<string[]>([]);
	const { closeModal } = useUI();

	const [inviteState, inviteAction, isInvitePending] = useActionState(
		sendVersionShareInvitation,
		initialState
	);
	const [existingReaders, setExistingReaders] = useState<VersionReader[]>([]);
	const [isLoadingReaders, setIsLoadingReaders] = useState(true);
	const [readersError, setReadersError] = useState<string | null>(null);
	const [isRemovalPending, setIsRemovalPending] = useState(false);
	const [removalError, setRemovalError] = useState<string | null>(null);

	useEffect(() => {
		const generateQRAndLink = async () => {
			try {
				const result = await getVersionSharingLink(version.id);
				if (result.success && result.data?.shareLink) {
					const link = result.data.shareLink as string;
					setShareLink(link);
					const qrDataUrl = await QRCode.toDataURL(link, {
						width: 200,
						margin: 2,
						color: { dark: "#000000", light: "#FFFFFF" },
					});
					setQrCodeUrl(qrDataUrl);
				}
			} catch (err) {
				console.error("Error generating QR code:", err);
			}
		};

		const fetchReaders = async () => {
			setIsLoadingReaders(true);
			setReadersError(null);
			try {
				const result = await getVersionWithReaders(version.id);
				if (result.success && result.readers) {
					setExistingReaders(result.readers);
				} else if (result.error) {
					setReadersError(result.error);
				}
			} catch (err) {
				console.error("Error fetching readers:", err);
				setReadersError("Error al obtener los lectores.");
			} finally {
				setIsLoadingReaders(false);
			}
		};

		if (session?.auth) {
			generateQRAndLink();
			fetchReaders();
		}
	}, [version.id, session?.auth]);

	const validateEmail = (value: string) =>
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

	const addNewReader = () => {
		if (!emailInput.trim() || !validateEmail(emailInput)) return;
		if (newReaders.includes(emailInput.trim())) {
			setError("Este email ya está en la lista de personas a agregar.");
			return;
		}
		setNewReaders([...newReaders, emailInput.trim()]);
		setEmailInput("");
		setError(undefined);
	};

	const removeNewReader = (email: string) => {
		setNewReaders(newReaders.filter((e) => e !== email));
	};

	const copyLink = async () => {
		if (shareLink) {
			await navigator.clipboard.writeText(shareLink);
			toast("Vínculo copiado al portapapeles", { duration: 5000 });
		}
	};

	const sendInvitations = () => {
		if (newReaders.length === 0) return;
		const formData = new FormData();
		formData.append("versionId", version.id);
		formData.append("collaborators", JSON.stringify(newReaders));
		startTransition(() => inviteAction(formData));
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setEmailInput(value);
		setError(
			value && !validateEmail(value) ? "Por favor, ingrese un email válido." : undefined
		);
	};

	const removeReader = (readerId: string) => {
		startTransition(async () => {
			setIsRemovalPending(true);
			setRemovalError(null);
			const result = await removeReaderFromVersion({
				versionId: version.id,
				readerId,
			});
			setIsRemovalPending(false);
			if (result.success) {
				setExistingReaders((prev) => prev.filter((r) => r.id !== readerId));
			} else {
				setRemovalError(result.error ?? "Error al remover.");
			}
		});
	};

	if (inviteState?.success) {
		return (
			<div className="flex flex-col gap-4 justify-center p-2 items-center">
				<h2 className="font-medium">Se ha compartido la versión exitosamente.</h2>
				<Button className="uppercase" onClick={closeModal}>
					Continuar
				</Button>
			</div>
		);
	}

	if (!version) return null;

	return (
		<div className="">
			<h2 className="text-xl font-semibold text-center mb-6 text-gray-900">
				Compartir versión (solo lectura)
			</h2>
			<p className="text-sm text-gray-600 text-center mb-4">
				{version.title}
			</p>

			{/* QR Code */}
			<div className="flex flex-col items-center mb-6">
				<div className="border-2 border-gray-200 rounded-lg p-4 mb-4">
					{qrCodeUrl ? (
						<img
							src={qrCodeUrl}
							alt="QR Code"
							className="w-48 h-48"
						/>
					) : (
						<div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
							<span className="text-gray-400">Generando QR...</span>
						</div>
					)}
				</div>
				<button
					onClick={copyLink}
					className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
					disabled={!shareLink}
				>
					<Link size={16} />
					Copiar vínculo
				</button>
			</div>

			{/* Add people */}
			<div className="mb-6">
				<h3 className="text-sm font-medium text-gray-700 mb-3">
					Añadir personas
				</h3>
				<div className="flex gap-2">
					<Input
						type="email"
						placeholder="Ingresa email"
						value={emailInput}
						onChange={handleChange}
						onKeyPress={(e) => e.key === "Enter" && addNewReader()}
						className="flex-1"
						containerClassName="w-full"
						error={error}
					/>
					<Button
						onClick={addNewReader}
						size="sm"
						variant="outline"
						className="px-3 bg-transparent"
					>
						<UserPlus size={16} />
					</Button>
				</div>
			</div>

			{/* New readers list + Send */}
			<div className="mb-4">
				{newReaders.length > 0 && (
					<div className="bg-gray-50 rounded-lg p-3">
						<div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
							<span>Email</span>
							<span>Acción</span>
						</div>
						{newReaders.map((email, index) => (
							<div
								key={index}
								className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
							>
								<span className="text-sm text-gray-900">{email}</span>
								<button
									disabled={isRemovalPending}
									onClick={() => removeNewReader(email)}
									className="text-gray-400 hover:text-red-500"
								>
									<X size={16} />
								</button>
							</div>
						))}
					</div>
				)}
				<Button
					onClick={sendInvitations}
					className="w-full mt-3 bg-gray-100 text-gray-700 hover:bg-gray-200"
					disabled={isInvitePending || newReaders.length === 0}
				>
					{isInvitePending ? "Enviando..." : "Enviar invitaciones"}
				</Button>
			</div>

			{/* Existing readers */}
			<div className="mb-6">
				<h3 className="text-sm font-medium text-gray-700 mb-3">
					Personas con acceso de lectura
				</h3>
				{readersError ? (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
						<p className="text-sm text-red-600">{readersError}</p>
					</div>
				) : (
					<div className="bg-gray-50 rounded-lg p-3">
						<div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
							<span>Email</span>
							<span>Acción</span>
						</div>
						{isLoadingReaders ? (
							<p className="text-sm text-gray-500 py-2">Cargando...</p>
						) : existingReaders.length === 0 ? (
							<p className="text-sm text-gray-500 py-2">
								Nadie con acceso solo lectura aún.
							</p>
						) : (
							existingReaders.map((reader) => (
								<div
									key={reader.id}
									className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
								>
									<span className="text-sm text-gray-900">
										{reader.email}
									</span>
									<button
										className="text-gray-400 hover:text-red-500"
										onClick={() => removeReader(reader.id)}
										disabled={isRemovalPending}
									>
										<X size={16} />
									</button>
								</div>
							))
						)}
					</div>
				)}
			</div>

			{(inviteState?.error || removalError) && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-sm text-red-600">
						{inviteState?.error || removalError}
					</p>
				</div>
			)}
		</div>
	);
};
