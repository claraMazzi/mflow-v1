import Unauthorized from "@components/auth/Unauthorized";
import { auth } from "@lib/auth";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth()

  if (!session) {
    return <Unauthorized />;
  }

  return <> {children} 
  </>;
}
