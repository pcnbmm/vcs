"use client";

import { UserCircle, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getRoles } from "@/app/actions/roleActions";

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const [roleMap, setRoleMap] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchRoles = async () => {
      const result = await getRoles();
      if (result.success) {
        const map = result.data.reduce(
          (acc, r) => {
            acc[r.roles_id] = r.roles_name ?? `Role ${r.roles_id}`;
            return acc;
          },
          {} as Record<number, string>,
        );
        setRoleMap(map);
      }
    };
    fetchRoles();
  }, []);

  const roleNames = (user?.roles ?? [])
    .map((r) => roleMap[r] ?? `Role ${r}`)
    .join(", ");

  const handleLogout = () => {
    signOut({ callbackUrl: `${window.location.origin}/login` });
  };

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10 text-slate-800">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 p-2 rounded-lg">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700">
              {user?.name ?? "ผู้ใช้งาน"}
            </p>
            <p className="text-xs text-slate-500">
              {roleNames || "ไม่ระบุ Role"}
            </p>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          <span className="hidden sm:block">ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
}
