"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import Link from "next/link"
import { Button } from "@/components/button"

interface FormData {
  email: string
}

export default function ForgotPassword() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setSuccessMessage(null)

    try {
      // Simulating API call
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Forgot Passowrd call failed");
      }
      setSuccessMessage("Las instrucciones han sido enviadas a tu correo electrónico.")
      reset()
    } catch (error) {
        setErrorMessage(
            error instanceof Error
              ? error.message
              : "Ocurrió un error durante el proceso"
          );
      console.error("Ocurrió un error al enviar las instrucciones:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-200 p-5">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <h2 className="text-2xl font-medium text-center text-gray-900">¿Olvidaste tu contraseña?</h2>

          <p className="text-sm text-center text-gray-600">
            Por favor ingresá tu e-mail. Las instrucciones para reiniciar tu contraseña serán enviadas a tu correo
            electrónico.
          </p>

          <div>
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address",
                },
              }}
              render={({ field }) => (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="tu@email.com"
                    {...field}
                  />
                  {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
                </div>
              )}
            />
          </div>

          {successMessage && <p className="text-sm text-green-600 text-center">{successMessage}</p>}
          {errorMessage && <p className="text-sm text-red-600 text-center">{errorMessage}</p>}

          <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
            ENVIAR EMAIL
          </Button>

          <div className="text-center">
            <Link href="/auth/login" className="text-sm text-purple-600 hover:text-purple-500">
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

