"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import {Controller, useForm} from "react-hook-form"
import {
  emailRegex,
  passwordRegex,
} from "../../../../../backend/src/config/regular-exp";
import { Button } from "@/components/button";

interface FormData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: "MODELADOR" | "VERIFICADOR" | "ADMIN" | string[];
}

export default function CreateAccount() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      rol: "MODELADOR",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      setIsSubmitted(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred during registration"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-200 p-4">
      <div className="w-full max-w-4xl bg-white shadow-md rounded-md p-8 border border-gray-200">
        {isSubmitted ? (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-medium text-purple-600">
              Te registraste correctamente!
            </h2>
            <p className="text-lg">
              Por favor revisa tu casilla de correo. Recibiras un email con un
              link para validar el correo electronico ingresado
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <h1 className="text-3xl font-medium text-center text-purple-600">
              MFLOW
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="nombre"
                control={control}
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <div>
                    <label
                      htmlFor="nombre"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Tu nombre"
                      {...field}
                    />
                    {errors.nombre && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.nombre.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="apellido"
                control={control}
                rules={{ required: "Last name is required" }}
                render={({ field }) => (
                  <div>
                    <label
                      htmlFor="apellido"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Apellido
                    </label>
                    <input
                      type="text"
                      id="apellido"
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Tu apellido"
                      {...field}
                    />
                    {errors.apellido && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.apellido.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="email"
                control={control}
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: emailRegex,
                    message: "Invalid email address",
                  },
                }}
                render={({ field }) => (
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      placeholder="tu@email.com"
                      {...field}
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="password"
                control={control}
                rules={{
                  required: "Password is required",
                  pattern: {
                    value: passwordRegex,
                    message:
                      "Password must be 6-25 characters and include at least one lowercase letter, one uppercase letter, one digit, and one special character (@$!%*?&)",
                  },
                }}
                render={({ field }) => (
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Contraseña
                    </label>
                    <input
                      type="password"
                      id="password"
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Tu contraseña"
                      {...field}
                    />
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <Controller
              name="rol"
              control={control}
              rules={{ required: "Role is required" }}
              render={({ field }) => (
                <div>
                  <label
                    htmlFor="rol"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Rol
                  </label>
                  <select
                    id="rol"
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    disabled
                    {...field}
                  >
                    <option value="MODELADOR">Modelador</option>
                    <option value="VERIFICADOR">Verificador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                  {errors.rol && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.rol.message}
                    </p>
                  )}
                </div>
              )}
            />

            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}

            <Button type="submit" isLoading={isLoading}>
              CREAR CUENTA
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Ya tenes una cuenta?</p>

              <Button
                type="submit"
                as="a"
                href="/auth/register"
                variant={"outline"}
              >
                INICIAR SESION{" "}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
