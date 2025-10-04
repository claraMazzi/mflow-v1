"use client"
import { EditingRequestToastView, useUI } from "../context";
import EditingRequestToast from "./editing-request-toast";

export default function EditingRequestToastContainer() {
  const { editingRequestToasts, removeEditingRequestToast } = useUI();

  if (editingRequestToasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {editingRequestToasts.map((toast: EditingRequestToastView) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-right-full duration-300"
        >
          <EditingRequestToast
            request={toast.request}
            collaborator={toast.collaborator}
            handleEditingRequestEvaluation={toast.handleEditingRequestEvaluation}
            onClose={() => removeEditingRequestToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
