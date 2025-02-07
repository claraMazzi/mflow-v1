import { useState } from "react"
import { useForm } from "@mantine/form"

interface AuthFormValues {
  nombre?: string
  apellido?: string
  email: string
  password: string
  rol?: string
}

type AuthFormType = "login" | "register" | "forgotPassword"

export const useAuthForm = (formType: AuthFormType) => {
  const [loading, setLoading] = useState(false)

  const form = useForm<AuthFormValues>({
    initialValues: {
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      rol: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Email inválido"),
      password: (value) =>
        formType === "forgotPassword"
          ? null
          : value.length < 6
            ? "La contraseña debe tener al menos 6 caracteres"
            : null,
      ...(formType === "register"
        ? {
            nombre: (value) => (value?.length ?? 0 < 2 ? "El nombre debe tener al menos 2 caracteres" : null),
            apellido: (value) => (value?.length ?? 0 < 2 ? "El apellido debe tener al menos 2 caracteres" : null),
            rol: (value) => (!value ? "Por favor, selecciona un rol" : null),
          }
        : {}),
    },
    validateInputOnBlur: true,
  })

  const handleSubmit = async (values: AuthFormValues) => {
    setLoading(true)
    try {
      switch (formType) {
        case "login":
          console.log("Iniciando sesión con:", values)
          break
        case "register":
          console.log("Creando cuenta con:", values)
          break
        case "forgotPassword":
          console.log("Solicitando recuperación de contraseña para:", values.email)
          break
      }
      // Simulamos una llamada a la API
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error("Error:", error)
      form.setErrors({ email: "Error en la autenticación" })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!form.isValid("email")) {
      form.validateField("email")
      return
    }
    setLoading(true)
    try {
      console.log("Solicitando recuperación de contraseña para:", form.values.email)
      // Simulamos una llamada a la API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // Aquí podrías mostrar un mensaje de éxito al usuario
    } catch (error) {
      console.error("Error:", error)
      form.setErrors({ email: "Error al solicitar recuperación de contraseña" })
    } finally {
      setLoading(false)
    }
  }

  return { form, loading, handleSubmit, handleForgotPassword }
}

