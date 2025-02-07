"use client"

import { TextInput, PasswordInput, Button, Paper, Title, Stack, Box, type MantineThemeOverride } from "@mantine/core"
import { MantineProvider } from "@mantine/core"
import { theme } from "../../theme"

export default function LoginForm() {


  return (
    <MantineProvider theme={theme}>
      <Box
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme?.colors?.purple?.[4] ?? "#ccbde2", // Fallback to a default color
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
          <Stack gap="lg">
            <Title order={1} ta="center" fw={500} c={theme?.colors?.purple?.[6]}>
              MFLOW
            </Title>

            <TextInput required label="Correo electrónico" placeholder="tu@email.com" radius="md" />

            <PasswordInput required label="Contraseña" placeholder="Tu contraseña" radius="md" />

            <Button
              fullWidth
              radius="md"
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

            <Button
              variant="subtle"
              size="compact"
              styles={(theme) => ({
                root: {
                  color: theme.colors?.grey?.[6] ?? "#868e96",
                  "&:hover": {
                    backgroundColor: "transparent",
                    textDecoration: "underline",
                    color: theme.colors?.purple?.[6] ?? "#837597",
                  },
                },
              })}
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </Stack>
        </Paper>
      </Box>
    </MantineProvider>
  )
}

