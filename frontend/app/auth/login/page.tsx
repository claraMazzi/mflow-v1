import { Paper, Box } from "@mantine/core"
import { MantineProvider } from "@mantine/core"
import { theme } from "@/theme"
import { LoginForm } from "@/app/auth/login/ui/login-form"

export default function Login() {

  return (
    <MantineProvider theme={theme}>
      <Box
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme?.colors?.purple?.[4] ?? "#ccbde2",
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
          <LoginForm/>
        </Paper>
      </Box>
    </MantineProvider>
  )
}

