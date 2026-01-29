"use client"

import { useLayoutState } from "@components/global/Context";
import MyProjects from "@components/dashboard/projects/my-projects";
import UserManager from "@components/dashboard/users/user-manager";
import PendingRevisions from "./revisions/pending-revisions";

const DashboardPage = () => {
  // return <DashboardContent />;
  const { activeRole } = useLayoutState();
  console.log("activeRole", activeRole);

  switch (activeRole) {
    case "verificador":
      return <PendingRevisions />;
    case "admin":
      return <UserManager />;
      // return <>test</>
    default:
      return <MyProjects />;
  }
};

export default DashboardPage;