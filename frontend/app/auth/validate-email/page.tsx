"use client"
import {
  Box,
  MantineProvider,
  Paper,
  Stack,
  Title,
  Text,
  Button,
  Loader,
} from "@mantine/core";
import React, { useEffect, useState } from "react";
import { theme } from "@/theme";
import { useRouter, useSearchParams } from "next/navigation";
const EmailValidation = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
const searchParams = useSearchParams()
  useEffect(() => {
    const token = searchParams.get("token")

    if (token) {
      validateEmail(token as string);
    }
  }, [searchParams]);

  const validateEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/validate-email/${token}`);
      const data = await response.json();

      if (response.ok) {
        setIsValid(true);
      } else {
        setErrorMessage(data.message || "Email validation failed");
      }
    } catch (error) {
      setErrorMessage("An error occurred during email validation");
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
          {isLoading ? (
            <Box
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
              }}
            >
              <Loader color={theme?.colors?.purple?.[6]} size="lg" />
            </Box>
          ) : (
            <Box style={{ textAlign: "center" }}>
              {isValid ? (
                <>
                  <Title
                    order={2}
                    style={{
                      color: theme?.colors?.purple?.[6],
                      marginBottom: "1rem",
                    }}
                  >
                    Email Verificado exitosamente
                  </Title>
                  <Text size="lg" style={{ marginBottom: "2rem" }}>
                    Tu email fue verificado exitosamente ahora puedes iniciar
                    sesión
                  </Text>
                </>
              ) : (
                <>
                  <Title
                    order={2}
                    style={{ color: "red", marginBottom: "1rem" }}
                  >
                    La verificación de tu email falló
                  </Title>
                  <Text size="lg" style={{ marginBottom: "2rem" }}>
                    La verificación de tu email falló, vas a poder solicitar un
                    nuevo codigo desde tu panel de cuenta
                  </Text>
                </>
              )}
              <Button
                fullWidth
                radius="md"
                component="a"
                href="/auth/login"
                style={{
                  backgroundColor: theme?.colors?.purple?.[6],
                  "&:hover": {
                    backgroundColor: theme?.colors?.purple?.[7],
                  },
                }}
              >
                Login
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </MantineProvider>
  );
};

export default EmailValidation;
