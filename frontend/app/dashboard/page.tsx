import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import ModeladorDashboard from "@components/modelador-dashboard"
import AdminDashboard from "@/components/AdminDashboard"
import VerificadorDashboard from "@/components/VerificadorDashboard"

export default async function DashboardPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

  switch (session.user.role) {
    case "modelador":
      return <ModeladorDashboard />
    case "admin":
      return <AdminDashboard />
    case "verificador":
      return <VerificadorDashboard />
    default:
      redirect("/unauthorized")
  }
}

