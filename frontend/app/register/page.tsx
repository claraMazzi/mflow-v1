"use client"

import { TextInput, PasswordInput, Button, Paper, Title, Stack, Box, Select, Text, Grid } from "@mantine/core"
import { MantineProvider } from "@mantine/core"
import { theme } from "../../theme"
import { useAuthForm } from "../../hooks/useAuthForm"


export default function CreateAccount() {
  const { form, loading, handleSubmit } = useAuthForm("register")

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
                disabled
                required
                data={[
                  { value: "MODERADOR", label: "Moderador" },
                  { value: "VERIFICADOR", label: "Verificador" },
                  { value: "ADMIN", label: "Administrador" },
                ]}
                radius="md"
                {...form.getInputProps("rol")}
              />

              <Button
                type="submit"
                fullWidth
                radius="md"
                loading={loading}
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
