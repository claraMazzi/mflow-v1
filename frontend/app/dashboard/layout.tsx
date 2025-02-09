import "@mantine/core/styles.css";
import React from "react";
import {
  MantineProvider,
  ColorSchemeScript,
  mantineHtmlProps,
  AppShell,
  Group,
  Burger,
  Text,
  Skeleton,
} from "@mantine/core";
import { auth } from "@/auth.config";
import { redirect } from "next/navigation";


export default async function DashboardLayout({ children }: { children: any }) {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <>{children}</>
  );
}
