import { LoginForm } from "@components/auth/login-form"

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-300 p-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-md p-8 border border-gray-200">
        <LoginForm />
      </div>
    </div>
  )
}

