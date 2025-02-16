import "@mantine/core/styles.css";
import React from "react";
import {
  MantineProvider,
  ColorSchemeScript,
  mantineHtmlProps,
} from "@mantine/core";
import { theme } from "../theme";
import '@/styles/global.css';
import { auth } from '@/auth.config'
import { redirect } from "next/navigation"

export const metadata = {
  title: "Mflow",
  description: "I am using Mantine with Next.js!",
};

export default async function RootLayout({ children }: { children: any }) {
  const session = await auth()
  
    
    if (!session) {
      redirect("/auth/login")
    } 

    // 
    // else {
    //   redirect("/dashboard")
    // }
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link href='https://fonts.googleapis.com/css?family=Exo 2' rel='stylesheet' />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>{children}</MantineProvider>
      </body>
    </html>
  );
}
