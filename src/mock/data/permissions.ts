import {
  LayoutDashboard,
  Car,
  ClipboardList,
  History,
  CheckCircle2,
  Navigation,
  FileBarChart,
  Settings,
  UserCog,
  Key,
} from "lucide-react";

export interface MenuItem {
  menu_id: number;
  menu_name: string;
  route_path: string;
  menu_icon: string;
  sort_order: number;
}

export interface RoleMenu {
  roles_id: number;
  menu_id: number;
}

// ── Mock vc_menu ─────────────────────────────────────────────
export const mockMenus: MenuItem[] = [
  {
    menu_id: 1,
    menu_name: "Dashboard",
    route_path: "/dashboard",
    menu_icon: "LayoutDashboard",
    sort_order: 1,
  },
  {
    menu_id: 2,
    menu_name: "ขอใช้รถ",
    route_path: "/booking",
    menu_icon: "ClipboardList",
    sort_order: 2,
  },
  {
    menu_id: 3,
    menu_name: "ติดตามคำขอ",
    route_path: "/pending",
    menu_icon: "Navigation",
    sort_order: 3,
  },
  {
    menu_id: 4,
    menu_name: "ประวัติคำขอ",
    route_path: "/history",
    menu_icon: "History",
    sort_order: 4,
  },
  {
    menu_id: 5,
    menu_name: "อนุมัติคำขอ",
    route_path: "/approver-requests",
    menu_icon: "CheckCircle2",
    sort_order: 5,
  },
  {
    menu_id: 6,
    menu_name: "จัดรถและคนขับ",
    route_path: "/assign",
    menu_icon: "UserCog",
    sort_order: 6,
  },
  {
    menu_id: 7,
    menu_name: "บันทึกการคืนรถ",
    route_path: "/returns",
    menu_icon: "Key",
    sort_order: 7,
  },
  {
    menu_id: 8,
    menu_name: "รายงาน",
    route_path: "/reports",
    menu_icon: "FileBarChart",
    sort_order: 8,
  },
  {
    menu_id: 9,
    menu_name: "จัดการสิทธิ์",
    route_path: "/permissions",
    menu_icon: "Settings",
    sort_order: 9,
  },
  {
    menu_id: 10,
    menu_name: "ข้อมูลรถ/คนขับ",
    route_path: "/registry",
    menu_icon: "Car",
    sort_order: 10,
  },
];

// ── Mock vc_roles ─────────────────────────────────────────────
export const mockRoles = [
  { roles_id: 1, roles_name: "User" },
  { roles_id: 2, roles_name: "Approver" },
  { roles_id: 3, roles_name: "Dispatcher" },
  { roles_id: 4, roles_name: "Admin" },
  { roles_id: 5, roles_name: "Dev" },
];

// ── Mock vc_menu_roles ────────────────────────────────────────
export const mockRoleMenus: RoleMenu[] = [
  // User
  { roles_id: 1, menu_id: 1 },
  { roles_id: 1, menu_id: 2 },
  { roles_id: 1, menu_id: 3 },
  { roles_id: 1, menu_id: 4 },
  // Approver
  { roles_id: 2, menu_id: 1 },
  { roles_id: 2, menu_id: 5 },
  // Dispatcher
  { roles_id: 3, menu_id: 1 },
  { roles_id: 3, menu_id: 6 },
  { roles_id: 3, menu_id: 7 },
  { roles_id: 3, menu_id: 8 },
  // Admin
  { roles_id: 4, menu_id: 1 },
  { roles_id: 4, menu_id: 9 },
  { roles_id: 4, menu_id: 10 },
  //Dev
  { roles_id: 5, menu_id: 1 },
  { roles_id: 5, menu_id: 2 },
  { roles_id: 5, menu_id: 3 },
  { roles_id: 5, menu_id: 4 },
  { roles_id: 5, menu_id: 5 },
  { roles_id: 5, menu_id: 6 },
  { roles_id: 5, menu_id: 7 },
  { roles_id: 5, menu_id: 8 },
  { roles_id: 5, menu_id: 9 },
  { roles_id: 5, menu_id: 10 },
];

// ── Icon Map ──────────────────────────────────────────────────
export const iconMap: Record<string, any> = {
  LayoutDashboard,
  ClipboardList,
  Navigation,
  History,
  CheckCircle2,
  UserCog,
  Key,
  FileBarChart,
  Settings,
  Car,
};

// ── Helper: ดึง menus ที่ user เข้าถึงได้จาก roles[] ─────────
export function getMenusByRoles(roleIds: number[]): MenuItem[] {
  const allowedMenuIds = mockRoleMenus
    .filter((rm) => roleIds.includes(rm.roles_id))
    .map((rm) => rm.menu_id);

  const uniqueMenuIds = [...new Set(allowedMenuIds)];

  return mockMenus
    .filter((m) => uniqueMenuIds.includes(m.menu_id))
    .sort((a, b) => a.sort_order - b.sort_order);
}
