"use client"
import React, { useActionState } from 'react'
import { useForm, Controller } from "react-hook-form"
import { TextInput, PasswordInput, Button, Paper, Title, Stack, Box, Text } from "@mantine/core"
import { MantineProvider } from "@mantine/core"
import { theme } from "@/theme"
import Link from "next/link"
import { authenticate } from '@/actions'
import { useFormState } from 'react-dom'

interface FormData {
    email: string
    password: string
  }

  
export const LoginForm = () => {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
  const callbackUrl = '/dashboard';

    const {
        control,
        handleSubmit,
        formState: { errors },
      } = useForm<FormData>({
        defaultValues: {
          email: "",
          password: "",
        },
        mode: "onBlur"
      })
    
      const onSubmit = handleSubmit(async (data) => {
        const formData = new FormData()
        formData.append('email', data.email)
        formData.append('password', data.password)
        formData.append('redirectTo', callbackUrl)
        await formAction(formData)
      })

  return (
    <form onSubmit={onSubmit} >
            <Stack gap="lg">
              <Title order={1} ta="center" fw={500} c={theme?.colors?.purple?.[6]}>
                MFLOW
              </Title>

              <Controller
                name="email"
                control={control}
                rules={{ required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } }}
                render={({ field }) => (
                  <TextInput
                    required
                    label="Correo electrónico"
                    placeholder="tu@email.com"
                    radius="md"
                    error={errors.email?.message}
                    {...field}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                rules={{ required: "Password is required" }}
                render={({ field }) => (
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="password">Contraseña</label>
                      <Link
                        href="/forgot-password"
                        style={{
                          color: theme?.colors?.grey?.[6],
                          textDecoration: "none",
                          fontSize: "14px",
                          //TODO ADD HOVER STYLE TO LINKS 
                          // "&:hover": {
                          //   textDecoration: "underline",
                          //   color: theme?.colors?.purple?.[6],
                          // },
                        }}
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <PasswordInput
                      id="password"
                      required
                      placeholder="Tu contraseña"
                      radius="md"
                      error={errors.password?.message}
                      {...field}
                    />
                  </div>
                )}
              />
              {errorMessage && <Text color="red">{errorMessage}</Text>}

              {/* {state?.error && <Text color="red">{state?.error}</Text>} */}
                            <input type="hidden" name="redirectTo" value={callbackUrl} />
              <Button
                type="submit"
                fullWidth
                radius="md"
                aria-disabled={isPending}
                loading={isPending}
                styles={(theme) => ({
                  root: {
                    backgroundColor: theme.colors?.purple?.[6] ?? "#837597",
                    "&:hover": {
                      backgroundColor: theme.colors?.purple?.[7] ?? "#6e6182",
                    },
                  },
                })}
              >
                INICIAR SESIÓN
              </Button>

              <Button fullWidth variant="default" radius="md">
                CREAR CUENTA
              </Button>
            </Stack>
          </form>
  )
}
