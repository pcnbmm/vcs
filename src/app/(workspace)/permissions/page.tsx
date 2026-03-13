// app/admin/permissions/page.tsx

'use client';

import { useState, useEffect } from 'react';
import {
    Shield,
    Save,
    CheckSquare,
    Square,
    Info,
    Search,
    UserPlus,
    Layout,
    CheckCircle2,
    HelpCircle,
    Loader2,
    AlertCircle
} from 'lucide-react';

// ==========================================
// ⬇️ Types & Interfaces ⬇️
// ==========================================
interface Permission { view: boolean; edit: boolean; delete: boolean; }
interface RolePermission { roleId: string; menuId: string; permissions: Permission; }
interface Role { id: string; name: string; displayName: string; }
interface User { id: string; name: string; dept: string; avatar: string; roles: string[]; }
interface Menu { id: string; name: string; path: string; }

export default function PermissionsPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'templates'>('users');

    // ==========================================
    // ⬇️ API States ⬇️
    // ==========================================
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [menus, setMenus] = useState<Menu[]>([]);
    const [globalPermissions, setGlobalPermissions] = useState<RolePermission[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // จำลองสิทธิ์ของ Current User (ระบบจริงควรดึงจาก Session/Token)
    // view: ดูได้, edit: แก้ไขและบันทึกได้
    const myPerms = { view: true, edit: true, delete: false };
    const isReadOnly = !myPerms.edit && !myPerms.delete;

    // ==========================================
    // ⬇️ UI States ⬇️
    // ==========================================
    const [searchUser, setSearchUser] = useState('');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

    const [tempRoles, setTempRoles] = useState<string[]>([]);
    const [localPermissions, setLocalPermissions] = useState<RolePermission[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // 1. โหลดข้อมูลเริ่มต้นจาก Database
    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                // TODO: เปลี่ยนเป็น URL API จริงของคุณ
                // const [usersRes, rolesRes, menusRes, permsRes] = await Promise.all([
                //   fetch('/api/users'), fetch('/api/roles'), fetch('/api/menus'), fetch('/api/permissions')
                // ]);
                // const usersData = await usersRes.json();
                // const rolesData = await rolesRes.json();
                // ... setStates

                // --- Mock Data จำลองการโหลดสำเร็จ ---
                setTimeout(() => {
                    const mockUsers = [
                        { id: 'u1', name: 'สมชาย ใจดี', dept: 'IT', avatar: 'S', roles: ['VCS_USER'] },
                        { id: 'u2', name: 'สมหญิง รักงาน', dept: 'HR', avatar: 'H', roles: ['DIVISION_PASS'] }
                    ];
                    const mockRoles = [
                        { id: 'r1', name: 'VCS_USER', displayName: 'ผู้ใช้บริการ (User)' },
                        { id: 'r2', name: 'DIVISION_PASS', displayName: 'ฝ่ายผู้ขอใช้รถ (Division)' }
                    ];
                    const mockMenus = [
                        { id: 'request-vehicle', name: 'ขอใช้รถยนต์', path: '/request' },
                        { id: 'history', name: 'ประวัติคำขอ', path: '/history' }
                    ];

                    setUsers(mockUsers);
                    setRoles(mockRoles);
                    setMenus(mockMenus);
                    setGlobalPermissions([]); // ใส่สิทธิ์เริ่มต้น

                    setEditingUserId(mockUsers[0].id);
                    setSelectedRoleId(mockRoles[0].id);

                    setIsLoading(false);
                }, 1000);
                // ------------------------------------

            } catch (err) {
                console.error(err);
                setError("ไม่สามารถโหลดข้อมูลสิทธิ์การใช้งานได้");
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const editingUser = users.find(u => u.id === editingUserId);
    const selectedRoleTemplate = roles.find(r => r.id === selectedRoleId);

    // 2. อัปเดตข้อมูล Local เมื่อเลือก User หรือมีการอัปเดตข้อมูลหลัก
    useEffect(() => {
        if (editingUser) {
            setTempRoles(editingUser.roles || []);
        }
    }, [editingUser, users]);

    useEffect(() => {
        setLocalPermissions(JSON.parse(JSON.stringify(globalPermissions)));
    }, [globalPermissions, selectedRoleId]);

    // ==========================================
    // ⬇️ Handlers ⬇️
    // ==========================================

    const getPermissionForMenu = (menuId: string): Permission => {
        const rp = localPermissions.find(p => p.roleId === selectedRoleId && p.menuId === menuId);
        return rp?.permissions || { view: false, edit: false, delete: false };
    };

    const updatePermission = (menuId: string, type: keyof Permission, value: boolean) => {
        if (isReadOnly || !selectedRoleId) return;

        setLocalPermissions(prev => {
            const newState = [...prev];
            const index = newState.findIndex(p => p.roleId === selectedRoleId && p.menuId === menuId);

            if (index !== -1) {
                newState[index].permissions[type] = value;
            } else {
                newState.push({
                    roleId: selectedRoleId,
                    menuId,
                    permissions: {
                        view: type === 'view' ? value : false,
                        edit: type === 'edit' ? value : false,
                        delete: type === 'delete' ? value : false,
                    }
                });
            }
            return newState;
        });
        setHasChanges(true);
    };

    const handleToggleTempRole = (roleId: string) => {
        if (isReadOnly) {
            alert('คุณไม่มีสิทธิ์แก้ไขบทบาท (Read-Only Mode)');
            return;
        }

        setTempRoles(prev => {
            if (prev.includes(roleId)) {
                if (prev.length > 1) {
                    return prev.filter(id => id !== roleId);
                } else {
                    alert('พนักงานต้องมีอย่างน้อย 1 บทบาท');
                    return prev;
                }
            } else {
                return [...prev, roleId];
            }
        });
    };

    // บันทึกบทบาทของ User
    const handleConfirmRoles = async () => {
        if (isReadOnly || !editingUserId) return;
        setIsSaving(true);
        try {
            // TODO: ยิง API อัปเดตบทบาทของพนักงาน
            // await fetch(`/api/users/${editingUserId}/roles`, {
            //   method: 'PUT',
            //   body: JSON.stringify({ roles: tempRoles })
            // });

            // จำลองการอัปเดต State ฝั่ง Client ให้ตรงกับที่เลือก
            setUsers(users.map(u => u.id === editingUserId ? { ...u, roles: tempRoles } : u));
            alert(`บันทึกบทบาทให้ ${editingUser?.name} เรียบร้อยแล้ว`);
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการบันทึกบทบาท');
        } finally {
            setIsSaving(false);
        }
    };

    // บันทึกแม่แบบสิทธิ์
    const handleSaveTemplates = async () => {
        if (isReadOnly) {
            alert('บัญชีของคุณมีสิทธิ์ "ดูอย่างเดียว (VIEW ONLY)" ไม่สามารถบันทึกแม่แบบได้');
            return;
        }
        setIsSaving(true);
        try {
            // TODO: ยิง API อัปเดต Permission สำหรับ Role ที่เลือก
            // await fetch(`/api/roles/${selectedRoleId}/permissions`, {
            //   method: 'PUT',
            //   body: JSON.stringify({ permissions: localPermissions.filter(p => p.roleId === selectedRoleId) })
            // });

            setGlobalPermissions(localPermissions);
            alert('บันทึกแม่แบบสิทธิ์ลงระบบส่วนกลางเรียบร้อยแล้ว');
            setHasChanges(false);
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการบันทึกแม่แบบ');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setLocalPermissions(JSON.parse(JSON.stringify(globalPermissions)));
        setHasChanges(false);
    };

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchUser.toLowerCase()));

    // ==========================================
    // ⬇️ Renders ⬇️
    // ==========================================

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลระบบจัดการสิทธิ์...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-rose-50 p-10 rounded-[2.5rem] border border-rose-100 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                <p className="text-rose-600 font-bold text-lg">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-xl">ลองใหม่อีกครั้ง</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header & Tab Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        {isReadOnly && (
                            <div className="absolute -top-2 -right-2 bg-amber-100 text-amber-600 p-1 rounded-full border border-amber-200" title="Read Only Mode">
                                <Info size={16} />
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">ระบบจัดการสิทธิ์ (Control Panel)</h1>
                        <p className="text-gray-500 font-medium tracking-tight">
                            {isReadOnly ? 'คุณกำลังอยู่ในโหมด VIEW ONLY (อ่านได้อย่างเดียว)' : 'จัดการ Role รายบุคคล และตั้งค่าสิทธิ์เข้าถึงเมนูส่วนกลาง'}
                        </p>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <UserPlus className="w-4 h-4" />
                        ตะกร้าสวมบทบาท
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'templates' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Layout className="w-4 h-4" />
                        ตั้งค่าแม่แบบ Role
                    </button>
                </div>
            </div>

            {activeTab === 'users' && editingUser ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* แผงรายชื่อพนักงาน */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 h-fit">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">เลือกพนักงาน</h3>
                                <p className="text-xs text-gray-400 font-medium">เลือกผู้ใช้เพื่อทำการปรับเปลี่ยนบทบาท</p>
                            </div>
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาชื่อ..."
                                    value={searchUser}
                                    onChange={(e) => setSearchUser(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredUsers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => setEditingUserId(user.id)}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${editingUserId === user.id ? 'border-blue-600 bg-blue-50/50' : 'border-transparent hover:bg-gray-50'}`}>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${editingUserId === user.id ? 'bg-blue-600 text-white' : 'bg-white border-2 border-gray-100 text-blue-600'}`}>
                                            {user.avatar}
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-bold ${editingUserId === user.id ? 'text-blue-900' : 'text-gray-700'}`}>{user.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{user.dept}</p>
                                        </div>
                                        {editingUserId === user.id && <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ส่วนอธิบาย Role */}
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                <HelpCircle className="w-6 h-6 text-blue-400" />
                                <h3 className="font-bold text-lg">คำอธิบายบทบาท</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-1">VCS_USER (ผู้ใช้บริการ)</p>
                                    <p className="text-xs text-slate-400 leading-relaxed italic">พนักงานทั่วไปที่ "มีสิทธิ์เขียนคำขอ" ใช้รถยนต์</p>
                                </div>
                                <div className="pt-2">
                                    <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1">DIVISION_PASS (ฝ่ายผู้ขอใช้รถ)</p>
                                    <p className="text-xs text-slate-400 leading-relaxed italic">หน่วยงานต้นสังกัดที่ดูภาพรวม ไม่มีสิทธิ์เขียนคำขอเอง</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ส่วนการเลือกหมวกสวมบทบาท */}
                    <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 h-fit">
                        <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-8">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">จัดการบทบาทให้: <span className="text-blue-600 underline underline-offset-8 decoration-blue-100">{editingUser.name}</span></h2>
                                <p className="text-sm text-gray-500 mt-2 font-medium italic">ติ๊กเลือกบทบาทที่ต้องการมอบหมาย แล้วกดยืนยันด้านล่าง</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {roles.map(role => {
                                const isTempActive = tempRoles.includes(role.id);
                                return (
                                    <button
                                        key={role.id}
                                        onClick={() => handleToggleTempRole(role.id)}
                                        className={`flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all text-left group ${isTempActive ? 'border-blue-600 bg-blue-50/50 shadow-md shadow-blue-50' : 'border-gray-50 bg-gray-50/50 hover:border-gray-200 hover:bg-white'}`}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${isTempActive ? 'text-blue-500' : 'text-gray-400'}`}>
                                                {role.name}
                                            </span>
                                            <span className={`font-bold text-lg ${isTempActive ? 'text-blue-900' : 'text-gray-700'}`}>
                                                {role.displayName}
                                            </span>
                                        </div>
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isTempActive ? 'bg-blue-600 text-white shadow-inner' : 'bg-white border-2 border-gray-100 group-hover:border-blue-200'}`}>
                                            {isTempActive && <CheckSquare className="w-5 h-5 transition-transform group-active:scale-90" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 p-2">
                            <div className="flex flex-col">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">การเปลี่ยนแปลง:</p>
                                <p className="text-sm font-bold text-blue-600 flex items-center gap-2 mt-1">
                                    {tempRoles.length} บทบาทที่จะได้รับ
                                </p>
                            </div>
                            <button
                                onClick={handleConfirmRoles}
                                disabled={isReadOnly || isSaving}
                                className={`px-12 py-5 rounded-2xl font-black text-base transition-all flex items-center gap-3 border-b-4 active:border-b-0 active:translate-y-1 shadow-xl
                  ${isReadOnly || isSaving
                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-800 shadow-blue-100'}`}
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                {isSaving ? 'กำลังบันทึก...' : 'ตกลง / ยืนยันบทบาท'}
                            </button>
                        </div>

                        <div className="mt-8 p-6 bg-gray-900 rounded-3xl flex items-center justify-between opacity-50 cursor-not-allowed">
                            <div>
                                <h4 className="font-bold text-white leading-tight">สลับตัวละครทันที? (ปิดใช้งานในระบบจริง)</h4>
                                <p className="text-xs text-slate-400 mt-1">ฟีเจอร์นี้ต้องใช้ระบบ Authentication จัดการ Session จาก Backend</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'templates' && selectedRoleTemplate ? (
                /* Template Section */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in slide-in-from-right duration-500">
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 h-fit sticky top-24">
                            <div className="mb-6">
                                <h3 className="text-lg font-black text-gray-900 mb-1">Templates</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">แก้ไขสิทธิ์พื้นฐานของ Role</p>
                            </div>
                            <div className="space-y-1.5 overflow-hidden">
                                {roles.map(role => (
                                    <button
                                        key={role.id}
                                        onClick={() => { setSelectedRoleId(role.id); setHasChanges(false); }}
                                        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${selectedRoleId === role.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 scale-[1.02]' : 'hover:bg-gray-50 text-gray-600 border border-transparent'}`}
                                    >
                                        <div className="text-left leading-tight">
                                            <p className={`text-[10px] font-black uppercase opacity-60 mb-0.5 ${selectedRoleId === role.id ? 'text-blue-100' : ''}`}>ROLE ID: {role.id}</p>
                                            <p className="text-sm font-black tracking-tight">{role.displayName}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-10 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">ตัวกำหนดแม่แบบ: <span className="text-blue-600 underline underline-offset-8 decoration-blue-50">{selectedRoleTemplate.displayName}</span></h2>
                                <p className="text-sm text-gray-400 mt-2 font-medium italic">แก้ไขสิทธิ์ VIEW/EDIT ของพนักงานทุกคนที่ถือหมวกใบนี้</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    disabled={!hasChanges || isSaving}
                                    className={`px-6 py-2.5 text-sm font-black rounded-xl transition-all ${hasChanges ? 'text-gray-900 bg-gray-200 hover:bg-gray-300' : 'text-gray-300 bg-gray-50 cursor-not-allowed'}`}
                                >
                                    RESET
                                </button>
                                <button
                                    onClick={handleSaveTemplates}
                                    disabled={!hasChanges || isSaving}
                                    className={`px-8 py-2.5 text-sm font-black rounded-xl transition-all flex items-center gap-2 shadow-xl ${hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 scale-105' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isSaving ? 'SAVING...' : 'SAVE TEMPLATE'}
                                </button>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {menus.map(menu => {
                                const perm = getPermissionForMenu(menu.id);
                                return (
                                    <div key={menu.id} className={`p-8 hover:bg-blue-50/10 transition-colors ${isReadOnly ? 'opacity-90 pointer-events-none' : ''}`}>
                                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                            <div className="flex items-center gap-5">
                                                <div className="flex flex-col">
                                                    <p className="text-base font-black tracking-tight text-gray-900">{menu.name}</p>
                                                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em]">{menu.path}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2.5">
                                                <PermissionToggle label="VIEW (อ่าน)" active={perm.view} onChange={(v) => updatePermission(menu.id, 'view', v)} />
                                                <PermissionToggle label="EDIT (แก้ไข)" active={perm.edit} onChange={(v) => updatePermission(menu.id, 'edit', v)} />
                                                <PermissionToggle label="DELETE (ลบ)" color="red" active={perm.delete} onChange={(v) => updatePermission(menu.id, 'delete', v)} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {isReadOnly && (
                            <div className="p-8 bg-amber-50 border-t border-amber-100 flex items-center gap-4">
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                                    <Info size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-amber-900">คุณอยู่ในโหมด "ดูอย่างเดียว"</p>
                                    <p className="text-xs text-amber-700">บัญชีของคุณไม่มีสิทธิ์ EDIT/DELETE สำหรับเมนูจัดการสิทธิ์ จึงไม่สามารถบันทึกการเปลี่ยนแปลงได้</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

// ==========================================
// ⬇️ UI Components ⬇️
// ==========================================

interface PermissionToggleProps {
    label: string;
    active: boolean;
    onChange: (value: boolean) => void;
    color?: 'blue' | 'red';
}

function PermissionToggle({ label, active, onChange, color = 'blue' }: PermissionToggleProps) {
    const colorMap: Record<'blue' | 'red', string> = {
        blue: active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 text-gray-400 border-gray-200',
        red: active ? 'bg-red-600 border-red-600 text-white' : 'bg-gray-50 text-gray-400 border-gray-200',
    };

    return (
        <button
            onClick={() => onChange(!active)}
            className={`relative group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-extrabold transition-all shadow-sm ${colorMap[color]} ${!active && 'hover:border-gray-300 hover:text-gray-600'}`}
        >
            {active ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 opacity-40" />}
            {label}
        </button>
    );
}