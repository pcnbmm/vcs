import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Car, ClipboardList, Users, 
  History, CheckCircle2, Navigation, FileBarChart, 
  Settings, UserCog, Key 
} from 'lucide-react';

const menuItems = [
  { title: 'Dashboard', href: '/workspace/dashboard', icon: LayoutDashboard },
  { title: 'ขอใช้รถ', href: '/workspace/booking', icon: ClipboardList },
  { title: 'ติดตามคำขอ', href: '/workspace/my-requests', icon: Navigation },
  { title: 'ประวัติคำขอ', href: '/workspace/history', icon: History },
  { title: 'อนุมัติคำขอ', href: '/workspace/approver-requests', icon: CheckCircle2 },
  { title: 'จัดรถและคนขับ', href: '/workspace/assign', icon: UserCog },
  { title: 'บันทึกการคืนรถ', href: '/workspace/returns', icon: Key },
  { title: 'รายงาน', href: '/workspace/reports', icon: FileBarChart },
  { title: 'จัดการสิทธิ์', href: '/workspace/permissions', icon: Settings },
  { title: 'ข้อมูลรถ/คนขับ', href: '/workspace/registry', icon: Car },
];

export default function Sidebar() {
    return (
        <div className="w-64 bg-slate-900 text-white h-screen p-4 flex flex-col">
            <div className="text-xl font-bold mb-8 px-2 text-blue-400 border-b border-slate-700 pb-4">
                VCS SYSTEM
            </div>

            <nav className="flex-1 overflow-y-auto">
                <ul className="space-y-2">
                    {menuItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <item.icon size={20} />
                                <span>{item.title}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="mt-auto p-4 bg-slate-800 rounded-lg text-center text-xs text-slate-400">
                <p>Dev Mode</p>
                <p>All Menus Enabled</p>
            </div>
        </div>
    );
}