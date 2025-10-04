"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@components/ui/common/input";
import { Button } from "@components/ui/common/button";
import { Checkbox } from "@components/ui/common/checkbox";
import { createAccount } from "./actions/create-account";
import cn from "clsx";
interface FormData {
  name: string;
  lastName: string;
  email: string;
  password: string;
  role: "MODELADOR" | "VERIFICADOR" | "ADMIN" | string[];
}

interface CreateAccountFormProps {
  defaultValues?: Partial<FormData>;
  successMessage?: string;
  title?: string;
  submitButtonText?: string;
  showLoginLink?: boolean;
  loginLinkText?: string;
  loginLinkHref?: string;
  onSuccess?: () => void;
  className?: string;
}

export default function CreateAccountForm({
  defaultValues = {
    name: "",
    lastName: "",
    email: "",
    password: "",
    role: "MODELADOR",
  },
  successMessage = "Te registraste correctamente! Por favor revisa tu casilla de correo. Recibiras un email con un link para validar el correo electronico ingresado",
  title = "MFLOW",
  submitButtonText = "CREAR CUENTA",
  showLoginLink = true,
  loginLinkText = "INICIAR SESION",
  loginLinkHref = "/login",
  onSuccess,
  className = "",
}: CreateAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormData>({
    defaultValues: { ...defaultValues },
    mode: "onBlur",
  });

  const parseErrorMessage = () => {
    if (!errorMessage) return;

    switch (errorMessage) {
      case "Registration failed":
        return "Ocurrio un error inesperado";
        
      default:
        return "Ocurrio un error inesperado";
    }
  };

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    const result = await createAccount(data);

    if (result.success) {
      setIsSubmitted(true);
      onSuccess?.();
    } else {
      setErrorMessage(result.error || "An error occurred during registration");
    }

    setIsLoading(false);
  };

  return (
    <div
      className={`min-h-screen flex flex-col gap-4 items-center justify-center bg-purple-200 p-4 ${className}`}
    >
      <div className="w-full max-w-xl flex flex-col gap-6 bg-white shadow-md rounded-md p-8 border border-gray-200">
        {isSubmitted ? (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-medium text-purple-600">
              {successMessage.split("!")[0]}!
            </h2>
            <p className="text-lg">
              {successMessage.split("!").slice(1).join("!").trim()}
            </p>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="flex flex-col text-center gap-2">
              <h1 className="text-3xl font-medium text-center text-purple-600">
                {title}
              </h1>
              <p>Crea tu cuenta</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Tu nombre"
                  {...form.register("name", {
                    required: "Nombre es requerido"
                  })}
                  value={form.watch("name") || ""}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Apellido<span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Tu apellido"
                  {...form.register("lastName", {
                    required: "Apellido es requerido"
                  })}
                  value={form.watch("lastName") || ""}
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-600">{form.formState.errors.lastName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Correo electrónico
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="tu@email.com"
                  {...form.register("email", {
                    required: "Correo electrónico es requerido",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Correo electrónico invalido",
                    },
                  })}
                  value={form.watch("email") || ""}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Contraseña<span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  placeholder="Tu contraseña"
                  {...form.register("password", {
                    required: "Contraseña es requerida",
                    pattern: {
                      value:
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,25}$/,
                      message:
                        "Contraseña debe tener entre 6-25 caracteres con al menos una minúscula, una mayúscula, un número y un caracter especial (@$!%*?&)",
                    },
                  })}
                  value={form.watch("password") || ""}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="self-baseline">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Roles a asignar:
                  </label>
                  <div className="flex flex-col gap-2 ml-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="modelador"
                        checked={form.watch("role")?.includes("MODELADOR")}
                        disabled
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label
                        htmlFor="modelador"
                        className="text-sm font-medium"
                      >
                        Modelador
                      </label>
                    </div>
                    <div
                      className={cn(
                        "flex items-center space-x-2",
                        !form.watch("role")?.includes("ADMIN") ? "hidden" : ""
                      )}
                    >
                      <Checkbox
                        id="admin"
                        checked={form.watch("role")?.includes("ADMIN")}
                        disabled
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label
                        htmlFor="admin"
                        className="text-sm font-medium"
                      >
                        Administrador
                      </label>
                    </div>

                    <div
                      className={cn(
                        "flex items-center space-x-2",
                        !form.watch("role")?.includes("VERIFICADOR")
                          ? "hidden"
                          : ""
                      )}
                    >
                      <Checkbox
                        id="verificador"
                        checked={form.watch("role")?.includes("VERIFICADOR")}
                        disabled
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label
                        htmlFor="verificador"
                        className="text-sm font-medium"
                      >
                        Verificador
                      </label>
                    </div>
                  </div>
                  {form.formState.errors.role && (
                    <p className="text-sm text-red-600">{form.formState.errors.role.message}</p>
                  )}
                </div>
              </div>
              <div className="h-full w-full flex items-end row-start-4 col-span-2 justify-center">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-fit w-full items-end"
                >
                  {isLoading ? "Creando..." : submitButtonText}
                </Button>
              </div>
            </div>

            {errorMessage && (
              <p className="text-sm text-red-600">{parseErrorMessage()}</p>
            )}
          </form>
        )}
      </div>

      {showLoginLink && !isSubmitted && (
        <div className="w-full max-w-xl flex flex-col gap-6 bg-white shadow-md rounded-md p-8 border border-gray-200">
          <div className="w-full flex flex-col items-center gap-2">
            <p className="text-gray-600 text-sm">Ya tienes una cuenta?</p>
            <Button
              asChild
              as="a"
              href={loginLinkHref}
              variant="outline"
              className="h-fit w-fit bg-transparent"
            >
              {loginLinkText}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
