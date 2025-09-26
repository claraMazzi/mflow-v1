"use client";

import { useLayoutState } from "@components/global/Context";
import MyProjects from "./projects/my-projects";
import UserManager from "./users/user-manager";

const DashboardContent = () => {
  const { activeRole } = useLayoutState();

  switch (activeRole) {
    case "verificador":
      return <div>Verificador</div>;
    case "admin":
      // return <UserManager />;
      return <>test</>
    default:
      return <MyProjects />;
  }
};

export default DashboardContent;
