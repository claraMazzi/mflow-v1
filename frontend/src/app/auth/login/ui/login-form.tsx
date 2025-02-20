"use client"

import { useActionState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import Link from "next/link";
import { authenticate } from "@/actions";
import { Button } from "@/components/button";

interface FormData {
  email: string;
  password: string;
}

export const LoginForm = () => {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  useEffect(() => {
    console.log("USEEFFECT", errorMessage, isPending);
  }, [isPending, errorMessage]);

  const {
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const parseErrorMessage = () => {
    if (!errorMessage) return;

    switch (errorMessage) {
      case "Invalid credentials.":
        return "Usuario o contraseña no corresponden a un usuario registrado";
      case "Something went wrong.":
      default:
        return "Ocurrio un error inesperado";
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      <h1 className="text-3xl font-medium text-center text-purple-600">
        MFLOW
      </h1>

      <div className="space-y-2">
        <Controller
          name="email"
          control={control}
          rules={{
            required: "Email is required",
            pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
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
                required
                placeholder="tu@email.com"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
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
      </div>

      <div className="space-y-2">
        <Controller
          name="password"
          control={control}
          rules={{ required: "Password is required" }}
          render={({ field }) => (
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Contraseña
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-gray-600 hover:text-purple-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                required
                placeholder="Tu contraseña"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
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

      {errorMessage && (
        <p className="text-sm text-red-600">{parseErrorMessage()}</p>
      )}

      <Button type="submit" isLoading={isPending}>
        INICIAR SESION
      </Button>

      <Button
        type="submit"
        as="a"
        href="/auth/register"
        variant="outline"
        isLoading={isPending}
      >
        CREAR CUENTA
      </Button>
    </form>
  );
};
