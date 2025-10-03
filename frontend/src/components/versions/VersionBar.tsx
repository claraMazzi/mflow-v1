import React, { useEffect, useMemo, useRef } from 'react'
import { Button } from "@components/ui/common/button";
import {
    ActiveEditingRequest,
    EditingRequest,
  } from "@hooks/use-request-editing-rights";
import { Collaborator } from '#types/collaboration';
import { Edit } from 'lucide-react';
import { useUI } from '../ui/context';

interface VersionBarProps {
    canUserSendEditingRequest: boolean;
    handleRequestEditingRights: () => void;
    pendingEditingRequests: EditingRequest[];
    collaborators: Map<string, Collaborator>;
    handleEditingRequestEvaluation: ({ requestId, action, }: { requestId: string; action: "accept" | "decline"; }) => () => void
}

const VersionBar = ({
    canUserSendEditingRequest,
    handleRequestEditingRights,
    pendingEditingRequests,
    collaborators,
    handleEditingRequestEvaluation
}:VersionBarProps) => {
    const { addEditingRequestToast } = useUI();
    const shownRequestsRef = useRef<Set<string>>(new Set());
    
    // Get pending requests that have valid collaborators
    const validPendingRequests = useMemo(() => {
      return pendingEditingRequests
        .filter((r): r is ActiveEditingRequest => r.status === "pending")
        .filter((r) => collaborators.get(r.requesterUserId));
    }, [pendingEditingRequests, collaborators]);

    // Show toast for each pending request
    useEffect(() => {
      validPendingRequests.forEach((request) => {
        if (!shownRequestsRef.current.has(request.requestId!)) {
          shownRequestsRef.current.add(request.requestId!);
          const collaborator = collaborators.get(request.requesterUserId)!;
          
          addEditingRequestToast({
            id: request.requestId!,
            type: 'editing-request',
            request,
            collaborator,
            handleEditingRequestEvaluation,
          });
        }
      });

      // Clean up shown requests that are no longer pending
      const currentRequestIds = new Set(validPendingRequests.map(r => r.requestId!));
      shownRequestsRef.current.forEach(requestId => {
        if (!currentRequestIds.has(requestId)) {
          shownRequestsRef.current.delete(requestId);
        }
      });
    }, [validPendingRequests, collaborators, addEditingRequestToast, handleEditingRequestEvaluation]);
    
  return (
    <div className='bg-blue-50 h-16'>
         <div className="flex flex-col absolute top-0 right-0 ">
                <Button
                  disabled={!canUserSendEditingRequest}
                  onClick={handleRequestEditingRights}
                >
                    <Edit className="h-4 w-4" />
                  SOLICITAR EDICIÓN
                </Button>
              </div>

    </div>
  )
}

export default VersionBar