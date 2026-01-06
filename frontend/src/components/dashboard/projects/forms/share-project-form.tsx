"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Button } from "@components/ui/common/button";
import { Input } from "@components/ui/common/input";
import { X, Link, UserPlus } from "lucide-react";
import QRCode from "qrcode";
import {
	sendProjectCollaborationInvitation,
	getProjectSharingLink,
	removeCollaboratorFromProject,
} from "../actions/share-project";
import { ProjectCollaborator, ProjectEntity } from "#types/project";
import { useUI } from "@components/ui/context";
import { toast } from "sonner";
import { useSession } from "@node_modules/next-auth/react";
import { Collaborator } from "@src/types/collaboration";

export type ShareProjectFormData = {
	id: string;
	collaborators?: string[];
};

interface ShareProjectFormProps {
	project: ProjectEntity;
}

const initialState = {
	error: undefined,
	success: false,
};

export const ShareProjectForm = ({ project }: ShareProjectFormProps) => {
	const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
	const [shareLink, setShareLink] = useState<string>("");
	const [emailInput, setEmailInput] = useState<string>("");
	const [error, setError] = useState<string | undefined>();
	const { data: session } = useSession();

	const [newCollaborators, setNewCollaborators] = useState<string[]>([]);
	const { closeModal } = useUI();

	const [inviteState, inviteAction, isInvitePending] = useActionState(
		sendProjectCollaborationInvitation,
		initialState
	);
	const [existingCollaborators, setExistingCollaborators] = useState<
		ProjectCollaborator[]
	>([]);
	const [isLoadingExistingCollaborators, setIsLoadingExistingCollaborators] =
		useState(true);
	const [existingCollaboratorsError, setExistingCollaboratorsError] = useState<
		string | null
	>(null);
	const [isCollaboratorRemovalPending, setIsCollaboratorRemovalPending] =
		useState(true);
	const [collaboratorRemovalError, setCollaboratorRemovalError] = useState<
		string | null
	>(null);

	// Generate QR code and get sharing link on component mount
	useEffect(() => {
		const generateQRAndLink = async () => {
			try {
				const result = await getProjectSharingLink(project.id);

				if (result.success && result.data?.shareLink) {
					const link = result.data.shareLink;
					setShareLink(link);

					// Generate QR code
					const qrDataUrl = await QRCode.toDataURL(link, {
						width: 200,
						margin: 2,
						color: {
							dark: "#000000",
							light: "#FFFFFF",
						},
					});
					setQrCodeUrl(qrDataUrl);
				}
			} catch (error) {
				console.error("Error generating QR code:", error);
			}
		};

		const fetchProjectCollaborators = async () => {
			setIsLoadingExistingCollaborators(true);
			setExistingCollaboratorsError(null);
			try {
				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project.id}`,
					{
						method: "GET",
						headers: {
							Authorization: `Bearer ${session?.auth}`,
						},
					}
				);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					setExistingCollaboratorsError(
						errorData.error ||
							"Error al obtener los colaboradores del proyecto desde el servidor."
					);
				}

				const data: { project: { collaborators: ProjectCollaborator[] } } =
					await response.json();

				console.log("Returned collaborators: ", data.project.collaborators);
				setExistingCollaborators(data.project.collaborators);
			} catch (error) {
				console.error(
					`Unexpected error during fething of Collaborators for project: ${project.id}`,
					error
				);
				setExistingCollaboratorsError(
					"Error al obtener los colaboradores del proyecto desde el servidor."
				);
			} finally {
				setIsLoadingExistingCollaborators(false);
			}
		};

		if (session?.auth) {
			generateQRAndLink();
			fetchProjectCollaborators();
		}
	}, [project.id, session?.auth]);

	const addNewCollaborator = () => {
		if (emailInput.trim() && validateEmail(emailInput)) {
			if (newCollaborators.includes(emailInput.trim())) {
				setError(
					"Este email ya se encuentra en la lista de personas a agregar al proyecto."
				);
				return;
			}

			setNewCollaborators([...newCollaborators, emailInput.trim()]);
			setEmailInput("");
		}
	};

	const removeNewCollaborator = (email: string) => {
		setNewCollaborators(newCollaborators.filter((c) => c !== email));
	};

	const copyLink = async () => {
		if (shareLink) {
			await navigator.clipboard.writeText(shareLink);
			toast("Vinculo copiado al portapapeles", {
				duration: 5000,
			});
		}
	};

	const sendInvitations = () => {
		if (newCollaborators.length === 0) return;

		const formData = new FormData();
		formData.append("id", project.id);
		formData.append("collaborators", JSON.stringify(newCollaborators));
		startTransition(() => {
			inviteAction(formData);
		});
	};

	const validateEmail = (value: string) => {
		// basic email regex, good enough for most cases
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(value);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setEmailInput(value);

		// live validation
		if (value && !validateEmail(value)) {
			setError("Por favor, ingrese un email válido.");
		} else {
			setError(undefined);
		}
	};

	const removeCollaborator = (collaboratorId: string) => {
		startTransition(async () => {
			setIsCollaboratorRemovalPending(true);
			setCollaboratorRemovalError(null);

			const actionResult = await removeCollaboratorFromProject({
				projectId: project.id,
				collaboratorId,
			});

			setIsCollaboratorRemovalPending(false);

			if (actionResult.success) {
				setExistingCollaborators((prevCollaborators) => {
					return prevCollaborators.filter((c) => c.id !== collaboratorId);
				});
			} else {
				setCollaboratorRemovalError(actionResult.error!);
			}
		});
	};

	if (inviteState?.success) {
		return (
			<div className="flex flex-col gap-4 justify-center p-2 items-center">
				<h2 className="font-medium">
					Se ha compartido el proyecto exitosamente!
				</h2>
				<Button className="uppercase" onClick={closeModal}>
					Continuar
				</Button>
			</div>
		);
	}

	if (!project) return <></>;

	return (
		<div className="">
			{/* Header */}
			<h2 className="text-xl font-semibold text-center mb-6 text-gray-900">
				Compartir Proyecto
			</h2>

			{/* QR Code Section */}
			<div className="flex flex-col items-center mb-6">
				<div className="border-2 border-gray-200 rounded-lg p-4 mb-4">
					{qrCodeUrl ? (
						<img
							src={qrCodeUrl || "/placeholder.svg"}
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

			{/* Add People Section */}
			<div className="mb-6">
				<h3 className="text-sm font-medium text-gray-700 mb-3">
					Añadir Personas
				</h3>
				<div className="flex gap-2">
					<Input
						type="email"
						placeholder="Ingresa email"
						value={emailInput}
						onChange={handleChange}
						onKeyPress={(e) => e.key === "Enter" && addNewCollaborator()}
						className="flex-1"
						containerClassName="w-full"
						error={error}
					/>
					<Button
						onClick={addNewCollaborator}
						size="sm"
						variant="outline"
						className="px-3 bg-transparent"
					>
						<UserPlus size={16} />
					</Button>
				</div>
			</div>

			{/* Collaborators List */}

			<div className="mb-4">
				{newCollaborators.length > 0 && (
					<div className="bg-gray-50 rounded-lg p-3">
						<div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
							<span>Email</span>
							<span>Acción</span>
						</div>
						{newCollaborators.map((email, index) => (
							<div
								key={index}
								className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
							>
								<span className="text-sm text-gray-900">{email}</span>
								<button
									disabled={isCollaboratorRemovalPending}
									onClick={() => removeNewCollaborator(email)}
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
					disabled={isInvitePending || newCollaborators.length == 0}
				>
					{isInvitePending ? "Enviando..." : "Enviar invitaciones"}
				</Button>
			</div>

			{/* Existing Collaborators */}
			<div className="mb-6">
				<h3 className="text-sm font-medium text-gray-700 mb-3">
					Personas que tienen acceso
				</h3>
				{existingCollaboratorsError ? (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
						<p className="text-sm text-red-600">{existingCollaboratorsError}</p>
					</div>
				) : (
					<div className="bg-gray-50 rounded-lg p-3">
						<div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
							<span>Integrante</span>
							<span>Acción</span>
						</div>
						{existingCollaborators.map((collaborator) => (
							<div
								key={collaborator.id}
								className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
							>
								<span className="text-sm text-gray-900">
									{collaborator.email}
								</span>
								<button
									className="text-gray-400 hover:text-red-500"
									onClick={() => removeCollaborator(collaborator.id)}
								>
									<X size={16} />
								</button>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Error Messages */}
			{(inviteState?.error || collaboratorRemovalError) && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-sm text-red-600">
						{inviteState?.error || collaboratorRemovalError}
					</p>
				</div>
			)}
		</div>
	);
};
