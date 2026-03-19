"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { iconMap } from "@/mock/data/permissions"; // ← iconMap ยังใช้อยู่
import { getMenusByRoleIds } from "@/app/actions/menuActions";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const pathname = usePathname();
  const { data: session } = useSession();
  const menuIconMap: Record<string, string> = {
    'Dashboard':          'LayoutDashboard',
    'ขอใช้รถ':            'ClipboardList',
    'ติดตามคำขอ':         'Navigation',
    'ประวัติคำขอ':        'History',
    'อนุมัติคำขอ':        'CheckCircle2',
    'จัดรถและคนขับ':      'UserCog',
    'บันทึกการคืนรถ':     'Key',
    'รายงาน':             'FileBarChart',
    'จัดการสิทธิ์':       'Settings',
    'ข้อมูลรถ/คนขับ':    'Car',
};

  useEffect(() => {
    const fetchMenus = async () => {
      const roles = session?.user?.roles ?? [];
      if (roles.length === 0) return;

      const result = await getMenusByRoleIds(roles);
      if (result.success) {
        setMenuItems(result.data);
      }
    };
    fetchMenus();
  }, [session]);

  return (
    <div
      className={`${isCollapsed ? "w-20" : "w-64"} bg-slate-900 text-white h-screen flex flex-col transition-all duration-300 relative border-r border-slate-800`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-6 bg-slate-800 text-slate-300 p-1.5 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:bg-slate-700 hover:text-white transition-all z-50 border border-slate-600 flex items-center justify-center group"
      >
        {isCollapsed ? (
          <ChevronRight
            size={16}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        ) : (
          <ChevronLeft
            size={16}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
        )}
      </button>

      {/* Logo */}
      <div
        className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} p-4 h-20 border-b border-slate-800 flex-shrink-0`}
      >
        {!isCollapsed ? (
          <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            VCS SYSTEM
          </div>
        ) : (
          <div className="text-xl font-bold bg-gradient-to-br from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            VS
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 sidebar-scrollbar">
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = iconMap[menuIconMap[item.menuname ?? ''] ?? ''];
            const routePath = item.route_path ?? "/";
            const isActive =
              pathname === routePath || pathname.startsWith(routePath + "/");
            return (
              <li key={item.menu_id}>
                <Link
                  href={routePath}
                  className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} p-3 rounded-xl transition-all group relative ${
                    isActive
                      ? "bg-blue-600/10 text-blue-400 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                  title={isCollapsed ? item.menuname : undefined}
                >
                  {Icon && (
                    <Icon
                      size={20}
                      className={`${isActive ? "text-blue-400" : "text-slate-400 group-hover:text-blue-400"} transition-colors flex-shrink-0`}
                    />
                  )}
                  {!isCollapsed && (
                    <span
                      className={`transition-colors tracking-wide ${isActive ? "text-blue-400 font-semibold" : "font-medium group-hover:text-white"}`}
                    >
                      {item.menuname}
                    </span>
                  )}

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                  )}

                  {/* Tooltip */}
                  {isCollapsed && (
                    <div className="absolute left-14 bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-slate-700">
                      {item.menuname}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
