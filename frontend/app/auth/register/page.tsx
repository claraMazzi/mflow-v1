"use client"

import { useState } from "react"
import { TextInput, PasswordInput, Button, Paper, Title, Stack, Box, Select, Text, Grid } from "@mantine/core"
import { MantineProvider } from "@mantine/core"
import { theme } from "../../../theme"
import { useForm } from "@mantine/form"
// import { useAuth } from "../../lib/auth"

export default function CreateAccount() {
  // const { register, isLoading, error } = useAuth()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm({
    initialValues: {
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      rol: "MODERADOR",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) => (value.length < 6 ? "Password should be at least 6 characters" : null),
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setSuccessMessage(null)
    // const result = await register(values)
    // if (result.success) {
    //   setSuccessMessage("Account created successfully!")
    //   form.reset()
    // }
  }

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
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              <Title order={1} ta="center" fw={500} c={theme?.colors?.purple?.[6]}>
                MFLOW
              </Title>

              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    required
                    label="Nombre"
                    placeholder="Tu nombre"
                    radius="md"
                    {...form.getInputProps("nombre")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    required
                    label="Apellido"
                    placeholder="Tu apellido"
                    radius="md"
                    {...form.getInputProps("apellido")}
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    required
                    label="Correo electrónico"
                    placeholder="tu@email.com"
                    radius="md"
                    {...form.getInputProps("email")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <PasswordInput
                    required
                    label="Contraseña"
                    placeholder="Tu contraseña"
                    radius="md"
                    {...form.getInputProps("password")}
                  />
                </Grid.Col>
              </Grid>

              <Select
                label="Rol"
                placeholder="Moderador"
                data={[
                  { value: "MODERADOR", label: "Moderador" },
                  { value: "VERIFICADOR", label: "Verificador" },
                  { value: "ADMIN", label: "Administrador" },
                ]}
                radius="md"
                disabled
                required
                {...form.getInputProps("rol")}
              />

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
                CREAR CUENTA
              </Button>

              <Stack gap="xs" align="center">
                <Text size="sm" c={theme?.colors?.grey?.[6]}>
                  Ya tenes una cuenta?
                </Text>
                <Button variant="default" radius="md" fullWidth>
                  INICIAR SESIÓN
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>
      </Box>
    </MantineProvider>
  )
}

