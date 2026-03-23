import { Suspense } from "react"
import { LoginForm } from "@components/auth/login-form"

function LoginFormFallback() {
  return (
    <div className="flex justify-center items-center h-48">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-600 border-t-transparent" />
    </div>
  )
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-300 p-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-md p-8 border border-gray-200">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}

