"use client";

import { useState } from "react";
import {
  TextInput,
  Button,
  Paper,
  Title,
  Stack,
  Box,
  Text,
} from "@mantine/core";
import { MantineProvider } from "@mantine/core";
import { theme } from "../../../theme";
// import { useAuth } from "../lib/auth";
import { useForm } from "@mantine/form";
import Link from "next/link";

export default function ForgotPassword() {
  // const { forgotPassword, isLoading, error } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      email: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setSuccessMessage(null);
    // const result = await forgotPassword(values.email);
    // if (result.success) {
    //   setSuccessMessage(
    //     "Las instrucciones han sido enviadas a tu correo electrónico."
    //   );
    //   form.reset();
    // }
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
            maxWidth: "530px",
            backgroundColor: "white",
          }}
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              <Title
                order={2}
                ta="center"
                fw={500}
              >
                ¿Olvidaste tu contraseña?
              </Title>

              <Text c="gray.6" ta="center" fs={'14px'}>
                Por favor ingresá tu e-mail. Las instrucciones para reiniciar tu
                contraseña serán enviadas a tu correo electrónico.
              </Text>

              <div>
                <TextInput
                  required
                  label="Correo electrónico"
                  placeholder="tu@email.com"
                  radius="md"
                  {...form.getInputProps("email")}
                />
              </div>

              {/* {error && <Text color="red">{error}</Text>} */}
              {successMessage && <Text color="green">{successMessage}</Text>}

              <Button
                type="submit"
                fullWidth
                radius="md"
                // loading={isLoading}
                styles={(theme) => ({
                  root: {
                    backgroundColor: theme?.colors?.purple?.[6],
                    "&:hover": {
                      backgroundColor: theme?.colors?.purple?.[7],
                    },
                  },
                })}
              >
                ENVIAR EMAIL
              </Button>

              <Link
                href="/login"
                style={{
                  textAlign: "center",
                  color: theme?.colors?.purple?.[6],
                  textDecoration: "none",
                  //   "&:hover": {
                  //     textDecoration: "underline",
                  //   },
                }}
              >
                Volver al inicio de sesión
              </Link>
            </Stack>
          </form>
        </Paper>
      </Box>
    </MantineProvider>
  );
}
