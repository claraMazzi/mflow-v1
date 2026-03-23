import React from "react";
import { getUserRolesFromInviteRequest } from "@components/dashboard/users/actions/invite-user";
import CreateAccountForm from "@components/auth/create-account-form";

export default async function AcceptInvitation({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>;
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
    email: string;
    roles: ("VERIFICADOR" | "ADMIN")[];
  };

  if (!data)
    return (
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-medium text-center text-purple-600">
          MFLOW
        </h1>
        <div>Esta invitación es inválida o ha expirado</div>
      </div>
    );
  return (
    <CreateAccountForm
      defaultValues={{ email: data.email, roles: [...data.roles, "MODELADOR"] }}
      showLoginLink={false}
    />
  );
}
