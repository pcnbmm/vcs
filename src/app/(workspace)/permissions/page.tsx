'use client';

import { useState } from 'react';
import {
    ShieldCheck,
    Users,
    Menu as MenuIcon,
    Settings,
    Key,
    UserCog
} from 'lucide-react';

import RoleTab from './RoleTab';
import MenuTab from './MenuTab';
import FunctionTab from './FunctionTab';
import UserRoleTab from './UserRoleTab';
import MenuRoleTab from './MenuRoleTab';

export default function PermissionsPage() {
    const [activeTab, setActiveTab] = useState<'roles' | 'menus' | 'functions' | 'user-roles' | 'menu-roles'>('roles');

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">


            {/* Tab Navigation */}
            <div className="flex flex-wrap bg-white rounded-lg p-1 shadow-sm border border-gray-100 w-full">
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`flex items-center justify-center gap-2 flex-1 min-w-[140px] py-3 rounded-md font-bold text-sm transition-all ${
                        activeTab === 'roles'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                    <Settings size={18} />
                    บทบาท (Roles)
                </button>
                <button
                    onClick={() => setActiveTab('menus')}
                    className={`flex items-center justify-center gap-2 flex-1 min-w-[140px] py-3 rounded-md font-bold text-sm transition-all ${
                        activeTab === 'menus'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                    <MenuIcon size={18} />
                    เมนู (Menus)
                </button>
                <button
                    onClick={() => setActiveTab('functions')}
                    className={`flex items-center justify-center gap-2 flex-1 min-w-[140px] py-3 rounded-md font-bold text-sm transition-all ${
                        activeTab === 'functions'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                    <Key size={18} />
                    ฟังก์ชัน (Functions)
                </button>
                <button
                    onClick={() => setActiveTab('user-roles')}
                    className={`flex items-center justify-center gap-2 flex-1 min-w-[140px] py-3 rounded-md font-bold text-sm transition-all ${
                        activeTab === 'user-roles'
                            ? 'bg-amber-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                    <Users size={18} />
                    สิทธิ์ผู้ใช้ (User Roles)
                </button>
                <button
                    onClick={() => setActiveTab('menu-roles')}
                    className={`flex items-center justify-center gap-2 flex-1 min-w-[140px] py-3 rounded-md font-bold text-sm transition-all ${
                        activeTab === 'menu-roles'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                    <UserCog size={18} />
                    สิทธิ์เมนู (Menu Roles)
                </button>
            </div>

            {/* Active Tab Content */}
            <div className="mt-4">
                {activeTab === 'roles' && <RoleTab />}
                {activeTab === 'menus' && <MenuTab />}
                {activeTab === 'functions' && <FunctionTab />}
                {activeTab === 'user-roles' && <UserRoleTab />}
                {activeTab === 'menu-roles' && <MenuRoleTab />}
            </div>
        </div>
    );
}
