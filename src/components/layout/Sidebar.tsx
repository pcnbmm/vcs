"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { getMenusByRoleIds } from "@/app/actions/menuActions";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchMenus = async () => {
      const roles = session?.user?.roles ?? [];
      if (roles.length === 0) return;
      const result = await getMenusByRoleIds(roles);
      if (result.success) {
        // Define menu order weights
        const menuOrder: { [key: string]: number } = {
          จัดรถ: 10,
          คืนรถ: 20,
          ขอเร่งด่วน: 30,
          ขอใช้รถ: 40,
          ขอใช้งานรถยนต์: 41,
          ติดตามคำขอ: 50,
          จัดการรถทดแทน: 60,
          รายงาน: 70,
          ข้อมูลรถและคนขับ: 80,
          อนุมัติคำขอ: 90,
          จัดการสิทธิ์: 100,
        };

        const sortedMenus = [...result.data].sort((a, b) => {
          const weightA = menuOrder[a.menuname] || 999;
          const weightB = menuOrder[b.menuname] || 999;
          return weightA - weightB;
        });
        setMenuItems(sortedMenus);
      }
    };
    fetchMenus();
  }, [session]);

  return (
    <div className="w-60 bg-slate-900 text-white h-screen flex flex-col border-r border-slate-800 shrink-0">
      <div className="flex items-center p-3 justify-center h-16 border-b border-slate-800 shrink-0">
        <div className="text-xl font-bold text-white tracking-widest">VCS</div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 sidebar-scrollbar">
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const routePath = item.route_path ?? "/";
            const isActive =
              pathname === routePath || pathname.startsWith(routePath + "/");
            return (
              <li key={item.menu_id}>
                <Link
                  href={routePath}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all group relative ${
                    isActive
                      ? "bg-blue-600/10 text-blue-400 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <span
                    className={`transition-colors tracking-wide ${isActive ? "text-blue-400 font-semibold" : "font-medium group-hover:text-white"}`}
                  >
                    {item.menuname}
                  </span>

                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
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
