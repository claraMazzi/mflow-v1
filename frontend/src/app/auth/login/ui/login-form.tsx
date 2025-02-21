"use client";

import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { authenticate } from "@/actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { startTransition } from "react";
import { toast } from "sonner"
import { useSearchParams } from "next/navigation";
interface FormData {
  email: string;
  password: string;
}

export const LoginForm = () => {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      toast("Contraseña actualizada", {
        description: "Tu contraseña fue actualizada correctamente. Ahora podes loguearte con tu nueva contraseña.",
        duration: 5000,
      })
    }
  }, [searchParams, toast])


  const form = useForm<FormData>({
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

  const handleSubmit = (data: FormData) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);
      formAction(formData);
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <h1 className="text-3xl font-medium text-center text-purple-600">
          MFLOW
        </h1>

        <FormField
          control={form.control}
          name="email"
          rules={{
            required: "Email is required",
            pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="tu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          rules={{ required: "Password is required" }}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Contraseña</FormLabel>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-gray-600 hover:text-purple-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <FormControl>
                <Input type="password" placeholder="Tu contraseña" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {errorMessage && (
          <p className="text-sm text-red-600">{parseErrorMessage()}</p>
        )}

        <Button type="submit" isLoading={isPending}>
          INICIAR SESION
        </Button>

        <Button
          as="a"
          href="/auth/register"
          variant="outline"
          isLoading={isPending}
        >
          CREAR CUENTA
        </Button>
      </form>
    </Form>
  );
};
