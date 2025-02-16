"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Stack,
  Box,
  Select,
  Text,
  Grid,
} from "@mantine/core";
import { MantineProvider } from "@mantine/core";
import { theme } from "@/theme";
import { useForm, Controller } from "react-hook-form";
import {
  emailRegex,
  passwordRegex,
} from "../../../../backend/src/config/regular-exp";

interface FormData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: "MODERADOR" | "VERIFICADOR" | "ADMIN" | string[];
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
      rol: ["MODELADOR"],
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

      // Registration successful
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
    <MantineProvider theme={theme}>
      <Box
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme?.colors?.purple?.[2],
          padding: "20px",
        }}
      >
        <Paper
          radius="md"
          p="xl"
          withBorder
          style={{
            width: "100%",
            maxWidth: "800px",
            backgroundColor: "white",
          }}
        >
          {isSubmitted ? (
            <Stack align="center">
              <Title
                order={2}
                ta="center"
                fw={500}
                c={theme?.colors?.purple?.[6]}
              >
                Te registraste correctamente!
              </Title>
              <Text size="lg" ta="center">
                Por favor revisa tu casilla de correo. Recibiras un email con un link para validar el correo electronico ingresado
              </Text>
            </Stack>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack gap="lg">
                <Title
                  order={1}
                  ta="center"
                  fw={500}
                  c={theme?.colors?.purple?.[6]}
                >
                  MFLOW
                </Title>

                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Controller
                      name="nombre"
                      control={control}
                      rules={{ required: "Name is required" }}
                      render={({ field }) => (
                        <TextInput
                          required
                          label="Nombre"
                          placeholder="Tu nombre"
                          radius="md"
                          error={errors.nombre?.message}
                          {...field}
                        />
                      )}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Controller
                      name="apellido"
                      control={control}
                      rules={{ required: "Last name is required" }}
                      render={({ field }) => (
                        <TextInput
                          required
                          label="Apellido"
                          placeholder="Tu apellido"
                          radius="md"
                          error={errors.apellido?.message}
                          {...field}
                        />
                      )}
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
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
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
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
                        <PasswordInput
                          required
                          label="Contraseña"
                          placeholder="Tu contraseña"
                          radius="md"
                          error={errors.password?.message}
                          {...field}
                        />
                      )}
                    />
                  </Grid.Col>
                </Grid>

                <Controller
                  name="rol"
                  control={control}
                  rules={{ required: "Role is required" }}
                  render={({ field }) => (
                    <Select
                      label="Rol"
                      placeholder="Moderador"
                      data={[
                        { value: "MODELADOR", label: "Modelador" },
                        { value: "VERIFICADOR", label: "Verificador" },
                        { value: "ADMIN", label: "Administrador" },
                      ]}
                      radius="md"
                      required
                      disabled
                      error={errors.rol?.message}
                      {...field}
                    />
                  )}
                />

                {errorMessage && <Text color="red">{errorMessage}</Text>}

                <Button
                  type="submit"
                  fullWidth
                  radius="md"
                  loading={isLoading}
                  styles={(theme) => ({
                    root: {
                      backgroundColor: theme?.colors?.purple?.[6],
                      "&:hover": {
                        backgroundColor: theme?.colors?.purple?.[7],
                      },
                    },
                  })}
                >
                  CREAR CUENTA
                </Button>

                <Stack gap="xs" align="center">
                  <Text size="sm" c={theme?.colors?.grey?.[6]}>
                    Ya tenes una cuenta?
                  </Text>
                  <Button
                    variant="default"
                    radius="md"
                    fullWidth
                    onClick={() => router.push("/login")}
                  >
                    INICIAR SESIÓN
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </Paper>
      </Box>
    </MantineProvider>
  );
}
