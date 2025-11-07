"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@components/ui/common/button"

const EmailValidation = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")

    if (token) {
      validateEmail(token as string)
    }
  }, [searchParams])

  const validateEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/validate-email/${token}`)
      const data = await response.json()

      if (response.ok) {
        setIsValid(true)
      } else {
        setErrorMessage(data.message || "Ocurrió un error durante la validación del email.")
      }
    } catch (error) {
      setErrorMessage("Ocurrió un error durante la validación del email.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-200 p-5">
      <div className="w-full max-w-2xl bg-white rounded-md shadow-md border border-gray-200 p-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="text-center">
            {isValid ? (
              <>
                <h2 className="text-2xl font-semibold text-purple-600 mb-4">Email Verificado exitosamente</h2>
                <p className="text-lg text-gray-600 mb-8">
                  Tu email fue verificado exitosamente, ahora puedes iniciar sesión.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-600 mb-4">La verificación de tu email falló</h2>
                <p className="text-lg  text-red-600 mb-8">
                  La verificación de tu email falló, vas a poder solicitar un nuevo codigo desde tu panel de cuenta.
                </p>
              </>
            )}
            <Button as="a" href="/login">INICIAR SESION</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmailValidation

