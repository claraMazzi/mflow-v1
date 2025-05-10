import Unauthorized from "@components/auth/Unauthorized";
import { authConfig } from "@lib/auth";
import getServerSession from "next-auth";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authConfig);
  if (!session) {
    return <Unauthorized />;
  }
  return <> {children} </>;
}
