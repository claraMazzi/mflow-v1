"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { passwordRegex } from "../../../../../../backend/src/config/regular-exp";

interface FormData {
  password: string;
  confirmPassword: string;
}

export default function PasswordRecovery({
  params,
}: {
  params: { token: string };
}) {
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paramToken, setParamToken] = useState<string | null>(null);
  const router = useRouter();
  const form = useForm<FormData>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });
  useEffect(() => {
    const validateToken = async () => {
      const resolvedParams = await params;
      setParamToken(resolvedParams.token);
      try {
        const response = await fetch(
          `/api/auth/forgot-password/${resolvedParams.token}`
        );
        if (response.ok) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
        }
      } catch (error) {
        console.error("Error validating token:", error);
        setIsValidToken(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [params, router]);

  const onSubmit = async (values: FormData) => {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: paramToken,
          password: values.password,
        }),
      });

      if (response.ok) {
        router.push("/auth/login?reset=success");
      } else {
        throw new Error("Password reset failed");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      form.setError("root", {
        type: "manual",
        message:
          "Ocurrió un error mientras se actualizaba la contraseña. Por favor recargue la página y vuelva a intentarlo",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-200 p-4">
        <div className="w-full max-w-xl flex flex-col items-center gap-8 bg-white shadow-md rounded-md p-8 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">
            Tu solicitud de recuperación expiró
          </h2>
          <p className="text-lg  text-red-600 mb-8">
            Podés volver a solicitar la recuperación de contraseña nuevamente
          </p>
          <Button as="a" href="/auth/forgot-password">
            Solicitar Nuevamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-200 p-4">
      <div className="w-full max-w-xl flex flex-col gap-8 bg-white shadow-md rounded-md p-8 border border-gray-200">
        <h1 className="text-2xl font-bold mb-5">Restablece tu contraseña</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                validate: (val: string) => {
                  if (form.watch("confirmPassword") != val) {
                    return "Your passwords do no match";
                  }
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              rules={{
                required: "Contraseña es requerida",
                pattern: {
                  value: passwordRegex,
                  message:
                    "Contraseña debe tener entre 6-25 caracteres con al menos una minúscula, una mayúscula, un número y un caracter especial (@$!%*?&)",
                },
                validate: (val: string) => {
                  if (form.watch("password") != val) {
                    return "Your passwords do no match";
                  }
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Reset Password</Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
