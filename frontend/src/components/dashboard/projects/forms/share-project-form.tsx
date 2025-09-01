"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Button } from "@components/ui/common/button";
import { Input } from "@components/ui/common/input";
import { X, Link, UserPlus } from "lucide-react";
import QRCode from "qrcode";
import {
  sendProjectCollaborationInvitation,
  getProjectSharingLink,
} from "../actions/share-project";
import { ProjectEntity } from "@src/types/project";
import { useUI } from "@src/components/ui/context";
import { toast } from "sonner";

export type ShareProjectFormData = {
  id: string;
  collaborators?: string[];
};

interface ShareProjectFormProps {
  onSuccess?: () => void;
  project: ProjectEntity;
}

const initialState = {
  error: undefined,
  success: false,
};

export const ShareProjectForm = ({
  onSuccess,
  project,
}: ShareProjectFormProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [shareLink, setShareLink] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>("");
  const [error, setError] = useState<string | undefined>();

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
      setError("Por favor ingresa un email válido");
    } else {
      setError(undefined);
    }
  };

  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [existingCollaborators] = useState<string[]>(
    project.collaborators.map((item) => item.email)
  );
  const { closeModal } = useUI();

  const [inviteState, inviteAction, isInvitePending] = useActionState(
    sendProjectCollaborationInvitation,
    initialState
  );

  const [linkState, linkAction, isLinkPending] = useActionState(
    getProjectSharingLink,
    initialState
  );

  // Generate QR code and get sharing link on component mount
  useEffect(() => {
    const generateQRAndLink = async () => {
      // Get sharing link from server
      const formData = new FormData();
      formData.append("id", project.id);

      try {
        const result = await getProjectSharingLink(initialState, formData);

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

    generateQRAndLink();
  }, [project.id]);

  const addCollaborator = () => {
    if (
      emailInput.trim() &&
      !collaborators.includes(emailInput.trim()) &&
      validateEmail(emailInput)
    ) {
      setCollaborators([...collaborators, emailInput.trim()]);
      setEmailInput("");
    }
  };

  const removeCollaborator = (email: string) => {
    setCollaborators(collaborators.filter((c) => c !== email));
  };

  const copyLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      toast("Vinculo copiado al portapapeles", {
        duration: 5000,
      });
    }
  };

  const sendInvitations = async () => {
    if (collaborators.length === 0) return;

    const formData = new FormData();
    formData.append("id", project.id);
    formData.append("collaborators", JSON.stringify(collaborators));
    startTransition(() => {
      inviteAction(formData);
    });
  };

  // Handle successful invitation sending
  // useEffect(() => {
  //   if (inviteState?.success) {
  //     setCollaborators([])
  //     // You could add a success toast here
  //   }
  // }, [inviteState?.success])

  if (inviteState?.success && onSuccess) {
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
            onKeyPress={(e) => e.key === "Enter" && addCollaborator()}
            className="flex-1"
            containerClassName="w-full"
            error={error}
          />
          <Button
            onClick={addCollaborator}
            size="sm"
            variant="outline"
            className="px-3 bg-transparent"
          >
            <UserPlus size={16} />
          </Button>
        </div>
      </div>

      {/* Collaborators List */}
      {collaborators.length > 0 && (
        <div className="mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
              <span>Email</span>
              <span>Acción</span>
            </div>
            {collaborators.map((email, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
              >
                <span className="text-sm text-gray-900">{email}</span>
                <button
                  onClick={() => removeCollaborator(email)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <Button
            onClick={sendInvitations}
            className="w-full mt-3 bg-gray-100 text-gray-700 hover:bg-gray-200"
            disabled={isInvitePending}
          >
            {isInvitePending ? "Enviando..." : "Enviar invitaciones"}
          </Button>
        </div>
      )}

      {/* Existing Collaborators */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Personas que tienen acceso
        </h3>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
            <span>Integrante</span>
            <span>Acción</span>
          </div>
          {existingCollaborators.map((email, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
            >
              <span className="text-sm text-gray-900">{email}</span>
              <button className="text-gray-400 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Error Messages */}
      {(inviteState?.error || linkState?.error) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            {inviteState?.error || linkState?.error}
          </p>
        </div>
      )}

      
    </div>
  );
};
