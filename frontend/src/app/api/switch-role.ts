// pages/api/switch-role.ts
import { getSession } from "next-auth/react"
import { NextApiRequest, NextApiResponse } from "next"
import { auth } from "@/auth.config"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   const session = await getSession({ req })
const session = await auth();

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const { newRole } = req.body

  if (!session.user.roles.includes(newRole)) {
    return res.status(403).json({ message: "Role not allowed" })
  }

  // Update the session with the new role
  session.user.currentRole = newRole

  // Update the session in the database or wherever you store sessions
  // This step depends on your NextAuth configuration

  res.status(200).json({ message: "Role updated successfully" })
}