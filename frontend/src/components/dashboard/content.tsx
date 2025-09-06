"use client";

import { useLayoutState } from "@components/global/Context";
import MyProjects from "./projects/my-projects";

const DashboardContent = () => {
  const { activeRole } = useLayoutState();

  switch (activeRole) {
    case "verificador":
      return <div>Verificador</div>;
    case "admin":
      return <div>Admin</div>;
    default:
      return <MyProjects />;
  }
};

export default DashboardContent;
