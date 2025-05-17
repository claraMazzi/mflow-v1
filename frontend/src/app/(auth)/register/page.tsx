"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@components/ui/common/form";
import { Input } from "@components/ui/common/input";
import { Button } from "@components/ui/common/button";
import {
  emailRegex,
  passwordRegex,
} from "../../../../../backend/src/config/regular-exp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/common/select";

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

  const form = useForm<FormData>({
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      rol: "MODELADOR",
    },
    mode: "onBlur",
  });

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      <div className="w-full max-w-3xl flex flex-col gap-8 bg-white shadow-md rounded-md p-8 border border-gray-200">
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
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <h1 className="text-3xl font-medium text-center text-purple-600">
                MFLOW
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  rules={{ required: "Nombre es requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apellido"
                  rules={{ required: "Apellido es requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    required: "Correo electrónico es requerido",
                    pattern: {
                      value: emailRegex,
                      message: "Correo electrónico invalido",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="tu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  rules={{
                    required: "Contraseña es requerida",
                    pattern: {
                      value: passwordRegex,
                      message:
                        "Contraseña debe tener entre 6-25 caracteres con al menos una minúscula, una mayúscula, un número y un caracter especial (@$!%*?&)",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Tu contraseña"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rol"
                  rules={{ required: "Role is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <FormControl>
                        <Select
                          // onValueChange={field.onChange}
                          disabled
                          defaultValue={"MODELADOR"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="MODELADOR" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MODELADOR">MODELADOR</SelectItem>
                            <SelectItem value="VERIFICADOR">
                              VERIFICADOR
                            </SelectItem>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="h-full flex items-end">
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="h-fit items-end"
                >
                  CREAR CUENTA
                </Button></div>
              </div>

              {errorMessage && (
                <p className="text-sm text-red-600">{errorMessage}</p>
              )}
            </form>
          </Form>
        )}
        <div className="w-full flex flex-col items-center gap-2">
          <p className="text-gray-600 text-sm">Ya tienes una cuenta?</p>
          <Button
            type="button"
            as="a"
            href="/auth/login"
            variant="outline"
            className="h-fit w-fit items-end"
          >
            INICIAR SESION
          </Button>
        </div>
      </div>
    </div>
  );
}
