import { Outlet } from 'react-router-dom';
import SidebarLayout from './SidebarLayout';

export default function DashboardLayout() {
  return (
    <SidebarLayout>
      <Outlet />
    </SidebarLayout>
  );
}