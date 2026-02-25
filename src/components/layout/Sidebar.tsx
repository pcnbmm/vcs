'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Car, ClipboardList, Users, 
  History, CheckCircle2, Navigation, FileBarChart, 
  Settings, UserCog, Key, ChevronLeft, ChevronRight
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
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white h-screen flex flex-col transition-all duration-300 relative border-r border-slate-800`}>
            {/* Toggle Button */}
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-4 top-6 bg-slate-800 text-slate-300 p-1.5 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:bg-slate-700 hover:text-white transition-all z-50 border border-slate-600 flex items-center justify-center group"
            >
                {isCollapsed ? <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />}
            </button>

            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 h-20 border-b border-slate-800 flex-shrink-0`}>
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

            {/* Custom Scrollbar Area */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 sidebar-scrollbar">
                <ul className="space-y-1.5">
                    {menuItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-3 rounded-xl hover:bg-slate-800/80 transition-all group relative`}
                                title={isCollapsed ? item.title : undefined}
                            >
                                <item.icon size={20} className="text-slate-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                                {!isCollapsed && (
                                    <span className="font-medium text-slate-300 group-hover:text-white transition-colors tracking-wide">{item.title}</span>
                                )}
                                
                                {/* Tooltip for collapsed state (optional visual upgrade) */}
                                {isCollapsed && (
                                    <div className="absolute left-14 bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-slate-700">
                                        {item.title}
                                    </div>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {!isCollapsed && (
                <div className="m-4 p-4 bg-slate-800/50 rounded-xl text-center text-xs text-slate-400 border border-slate-700/50">
                    <p className="font-medium text-slate-300 mb-1">Dev Mode</p>
                    <p>All Menus Enabled</p>
                </div>
            )}
        </div>
    );
}