"use client";
import { NavigationSidebar } from "@/components";
import { AppShell, Group, Burger, Text, Skeleton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

const DashboardPage = () => {
  const [opened, { toggle }] = useDisclosure();
  //TODO: agregar logica para switchear entre dashboards

  return (
    // <div className="p-4">
    //   <h1 className="text-2xl font-bold mb-4">Modelador Dashboard</h1>
    //   {/* Add modelador-specific content here */}
    // </div>

    <AppShell
      layout="alt"
      // header={{ height: 60 }}
      // footer={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
      // aside={{
      //   width: 300,
      //   breakpoint: "md",
      //   collapsed: { desktop: false, mobile: true },
      // }}
      padding="md"
    >
      {/* <AppShell.Header>
      <Group h="100%" px="md">
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <MantineLogo size={30} />
      </Group>
    </AppShell.Header> */}
      <AppShell.Navbar p="md">
        {/* <Group>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <Text>Navbar</Text>
      </Group>
      {Array(15)
        .fill(0)
        .map((_, index) => (
          <Skeleton key={index} h={28} mt="sm" animate={false} />
        ))} */}
        <NavigationSidebar />
      </AppShell.Navbar>
      <AppShell.Main>
        Alt layout – Navbar and Aside are rendered on top on Header and Footer
      </AppShell.Main>
      {/* <AppShell.Aside p="md">Aside</AppShell.Aside>
    <AppShell.Footer p="md">Footer</AppShell.Footer> */}
    </AppShell>
  );
};

export default DashboardPage;
