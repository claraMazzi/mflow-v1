"use client"
import dynamic from "next/dynamic";

const DashboardPage = dynamic(() => import("../../../components/dashboard/dashboard-page"), {
  ssr: false,
});

export default DashboardPage;
