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
            (pathname === item.route_path || pathname.startsWith(item.route_path + "/"))
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
    <div className="mb-8 overflow-hidden rounded-[2rem] shadow-sm border border-slate-200 bg-white relative">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none select-none bg-gradient-to-l from-blue-600 to-transparent"></div>
      <div 
        className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" 
        style={{ animation: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
      ></div>
      <div 
        className="absolute -right-40 top-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"
        style={{ animation: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite 2s" }}
      ></div>

      <div className="p-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {menuTitle}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
