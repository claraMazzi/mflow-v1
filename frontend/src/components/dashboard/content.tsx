
'use client'

import { useLayoutState } from "@components/global/Context";
import MyProjects from "./modelador/my-projects";

const DashboardContent = () => {

    const { activeRole } = useLayoutState();
    console.log('active', activeRole)

    switch (activeRole) {   
        case 'verificador':
            return <div>Verificador</div>
        case 'admin':
            return <div>Admin</div>
        default:
            return <MyProjects />
    }
}

export default DashboardContent