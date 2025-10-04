"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@components/ui/common/button";
import { Input } from "@components/ui/common/input";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

interface FormData {
  email: string;
  password: string;
}

export const LoginForm = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      toast("Contraseña actualizada", {
        description:
          "Tu contraseña fue actualizada correctamente. Ahora podes loguearte con tu nueva contraseña.",
        duration: 5000,
      });
    }
  }, [searchParams]);

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

  const handleSubmit = async (data: FormData) => {
    setIsPending(true);
    setErrorMessage(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage('Invalid credentials.');
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch {
      setErrorMessage('Something went wrong.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <h1 className="text-3xl font-medium text-center text-purple-600">
        MFLOW
      </h1>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Correo electrónico
        </label>
        <Input 
          type="email" 
          placeholder="tu@email.com" 
          {...form.register("email", {
            required: "Email is required",
            pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
          })}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Contraseña
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-gray-600 hover:text-purple-600 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Input 
          type="password" 
          placeholder="Tu contraseña" 
          {...form.register("password", {
            required: "Password is required"
          })}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
        )}
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600">{parseErrorMessage()}</p>
      )}

      <div className="flex flex-nowrap justify-center gap-2">
        <Button type="submit" isLoading={isPending} className="w-full">
          INICIAR SESION
        </Button>

        <Button
          as="a"
          href="/register"
          variant="outline"
          isLoading={isPending}
          className="w-full"
        >
          CREAR CUENTA
        </Button>
      </div>
    </form>
  );
};
