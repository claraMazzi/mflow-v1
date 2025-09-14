import React from "react";
import { getUserRolesFromInviteRequest } from "@components/dashboard/users/actions/invite-user";
import { UserInvitationForm } from "@components/dashboard/users/forms/user-invitation-form";

export default async function AcceptInvitation({
  searchParams,
}: {
  searchParams: { token: string };
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token)
    return (
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-medium text-center text-purple-600">
          MFLOW
        </h1>
        <div>Esta invitación es inválida</div>
      </div>
    );

  const data = (await getUserRolesFromInviteRequest(token)) as {
    roles: string[];
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-300 p-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-md p-8 border border-gray-200">
        {/* <ProjectInvitationForm project={data.project} token={token} /> */}
        <UserInvitationForm roles={data.roles} token={token} />
      </div>
    </div>
  );
}
