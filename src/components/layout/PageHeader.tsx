"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { getMenusByRoleIds } from "@/app/actions/menuActions";
import { FileText, ChevronRight, LayoutDashboard } from "lucide-react";

export default function PageHeader() {
  const [menuTitle, setMenuTitle] = useState<string | null>("Loading...");
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchMenus = async () => {
      const roles = session?.user?.roles ?? [];
      if (roles.length === 0) {
        setMenuTitle("VCS Workspace");
        return;
      }
      const result = await getMenusByRoleIds(roles);
      if (result.success) {
        const currentMenu = result.data.find(
          (item) =>
            item.route_path &&
            (pathname === item.route_path ||
              pathname.startsWith(item.route_path + "/")),
        );
        if (currentMenu && currentMenu.menuname) {
          setMenuTitle(currentMenu.menuname);
        } else {
          setMenuTitle("VCS Workspace");
        }
      } else {
        setMenuTitle("VCS Workspace");
      }
    };
    fetchMenus();
  }, [session, pathname]);

  return (
    <div className="mb-4 overflow-hidden rounded-2xl shadow-sm border border-slate-200 bg-white relative">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none select-none bg-linear-to-l from-blue-600 to-transparent"></div>
      <div className="px-6 py-4 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {menuTitle}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
