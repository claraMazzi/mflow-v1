"use client"

import DashboardContent from "@components/dashboard/content";
import { useLayoutState } from "@components/global/Context";
import MyProjects from "@components/dashboard/projects/my-projects";
import UserManager from "@components/dashboard/users/user-manager";

const DashboardPage = () => {
  // return <DashboardContent />;
  const { activeRole } = useLayoutState();

  switch (activeRole) {
    case "verificador":
      return <div>Verificador</div>;
    case "admin":
      return <UserManager />;
      // return <>test</>
    default:
      return <MyProjects />;
  }
};

export default DashboardPage;