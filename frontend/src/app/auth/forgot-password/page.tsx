"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"

interface FormData {
  email: string
}

export default function ForgotPassword() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<FormData>({
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setSuccessMessage(null)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Forgot Password call failed")
      }
      setSuccessMessage("Las instrucciones han sido enviadas a tu correo electrónico.")
      form.reset()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Ocurrió un error durante el proceso"
      )
      console.error("Ocurrió un error al enviar las instrucciones:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-200 p-5">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <h2 className="text-2xl font-medium text-center text-gray-900">¿Olvidaste tu contraseña?</h2>
            <p className="text-sm text-center text-gray-600">
              Por favor ingresá tu e-mail. Las instrucciones para reiniciar tu contraseña serán enviadas a tu correo
              electrónico.
            </p>

            <FormField
              control={form.control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <FormControl>
                    <Input type="email" id="email" placeholder="tu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
        </Form>
      </div>
    </div>
  )
}
