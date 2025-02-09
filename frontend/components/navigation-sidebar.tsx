"use client";

import {
  IconBell,
  IconFiles,
  IconFolder,
  IconFolderShare,
  IconLogout,
  IconUser,
  IconChecks,
  IconClock,
  IconCheck,
} from "@tabler/icons-react";
import {
  Avatar,
  Box,
  Flex,
  NavLink,
  Select,
  Stack,
  Text,
  rem,
} from "@mantine/core";
import { useState } from "react";
import { logout } from "@/actions";

type Role = "MODELADOR" | "ADMIN" | "VERIFICADOR";

const roleData: Record<
  Role,
  {
    label: string;
    navigation: Array<{ icon: React.ReactNode; label: string; href: string }>;
  }
> = {
  MODELADOR: {
    label: "MODELADOR",
    navigation: [
      {
        icon: <IconFolder style={{ width: rem(20) }} />,
        label: "Mis proyectos",
        href: "#",
      },
      {
        icon: <IconFolderShare style={{ width: rem(20) }} />,
        label: "Compartidos conmigo",
        href: "#",
      },
      {
        icon: <IconFiles style={{ width: rem(20) }} />,
        label: "Proyectos",
        href: "#",
      },
      {
        icon: <IconFiles style={{ width: rem(20) }} />,
        label: "Artefactos",
        href: "#",
      },
    ],
  },
  ADMIN: {
    label: "Administrador",
    navigation: [
      {
        icon: <IconUser style={{ width: rem(20) }} />,
        label: "Usuarios",
        href: "#",
      },
      {
        icon: <IconFolder style={{ width: rem(20) }} />,
        label: "Solicitudes de eliminación",
        href: "#",
      },
      {
        icon: <IconBell style={{ width: rem(20) }} />,
        label: "Solicitudes de verificación",
        href: "#",
      },
    ],
  },
  VERIFICADOR: {
    label: "Verificador",
    navigation: [
      {
        icon: <IconClock style={{ width: rem(20) }} />,
        label: "Revisiones pendientes",
        href: "#",
      },
      {
        icon: <IconChecks style={{ width: rem(20) }} />,
        label: "Revisiones en curso",
        href: "#",
      },
      {
        icon: <IconCheck style={{ width: rem(20) }} />,
        label: "Revisiones finalizadas",
        href: "#",
      },
    ],
  },
};

export default function NavigationSidebar() {
  const [role, setRole] = useState<Role>("MODELADOR");

  return (
    <Stack h="100%" p="md" justify="space-between">
      <Stack gap={"md"}>
        <Stack gap={"sm"}>
          <Flex justify="space-between" align="items-center">
            <Flex align="center" gap={3} className="flex items-center gap-3">
              <Avatar color="blue" radius="xl">
                AH
              </Avatar>
              <Text size="sm" ml={10} fw={500}>
                Amy Horsefighter
              </Text>
            </Flex>
            <Flex align="center">
              <IconBell style={{ width: rem(20) }} />
            </Flex>
          </Flex>

          <Select
            data={[
              { value: "MODELADOR", label: "Modelador" },
              { value: "ADMIN", label: "Administrador" },
              { value: "VERIFICADOR", label: "Verificador" },
            ]}
            value={role}
            onChange={(value) => setRole(value as Role)}
          />
        </Stack>

        <Stack className="flex-1" gap="xs">
          {roleData[role].navigation.map((item) => (
            <NavLink
              key={item.label}
              leftSection={item.icon}
              label={item.label}
              href={item.href}
            />
          ))}
        </Stack>
      </Stack>

      <NavLink
        leftSection={<IconLogout style={{ width: rem(20) }} />}
        label="Cerrar sesión"
        onClick={() => logout()}
      />
    </Stack>
  );
}
