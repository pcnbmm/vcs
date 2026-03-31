'use client';
import { showSuccess, showError, showWarning, showConfirm } from "@/lib/sweetalert";


import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit2, X, Loader2, Save, Component, LayoutList } from 'lucide-react';

export default function MenuRoleTab() {
    const [groupedMenuRoles, setGroupedMenuRoles] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [menus, setMenus] = useState<any[]>([]);
    const [functions, setFunctions] = useState<any[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    
    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    type Mapping = { menu_id: number; function_id: number | null };
    const [formData, setFormData] = useState<{
        roles_id: string;
        mappings: Mapping[];
    }>({
        roles_id: '',
        mappings: []
    });

    useEffect(() => {
        fetchData();
        fetchOptions();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/permissions/menu-roles');
            if (res.ok) {
                const data = await res.json();
                setGroupedMenuRoles(data);
            }
        } catch (error) {
            console.error('Error fetching menu roles:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [rolesRes, menusRes, funcsRes] = await Promise.all([
                fetch('/api/permissions/roles'),
                fetch('/api/permissions/menus'),
                fetch('/api/permissions/functions')
            ]);
            
            if (rolesRes.ok) setRoles(await rolesRes.json());
            if (menusRes.ok) setMenus(await menusRes.json());
            if (funcsRes.ok) setFunctions(await funcsRes.json());
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const filteredMenuRoles = groupedMenuRoles.filter(mr => 
        (mr.roles_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        mr.menus.some((m: any) => (m.menuname || '').toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredMenuRoles.length / itemsPerPage);
    const currentMenuRoles = filteredMenuRoles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const openModal = (mr?: any) => {
        if (mr) {
            // Flatten existing complex groupings back to mappings array
            const restoredMappings: Mapping[] = [];
            mr.menus.forEach((m: any) => {
                if (m.has_general_access) {
                    restoredMappings.push({ menu_id: m.menu_id, function_id: null });
                }
                m.functions.forEach((f: any) => {
                    restoredMappings.push({ menu_id: m.menu_id, function_id: f.function_id });
                });
            });

            setFormData({
                roles_id: String(mr.roles_id),
                mappings: restoredMappings
            });
        } else {
            setFormData({ roles_id: '', mappings: [] });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({ roles_id: '', mappings: [] });
    };

    const toggleMapping = (menuId: number, functionId: number | null) => {
        setFormData(prev => {
            const exists = prev.mappings.some(m => m.menu_id === menuId && m.function_id === functionId);
            if (exists) {
                return { ...prev, mappings: prev.mappings.filter(m => !(m.menu_id === menuId && m.function_id === functionId)) };
            } else {
                return { ...prev, mappings: [...prev.mappings, { menu_id: menuId, function_id: functionId }] };
            }
        });
    };

    // Helper to check if a mapping exists
    const hasMapping = (menuId: number, functionId: number | null) => {
        return formData.mappings.some(m => m.menu_id === menuId && m.function_id === functionId);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.roles_id) return showWarning('กรุณาเลือกบทบาท');

        setIsSaving(true);
        try {
            const res = await fetch('/api/permissions/menu-roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Saving failed');
            
            await fetchData();
            closeModal();
        } catch (error) {
            console.error('Error saving menu roles:', error);
            showError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (rolesId: number) => {
        if (!(await showConfirm('ยืนยันการลบสิทธิ์เมนูและฟังก์ชันทั้งหมดของบทบาทนี้ ใช่หรือไม่?'))) return;
        try {
            const res = await fetch(`/api/permissions/menu-roles/${rolesId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Deletion failed');
            await fetchData();
        } catch (error) {
            console.error('Error deleting menu roles:', error);
            showError('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="relative w-full md:w-[400px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อบทบาท, เมนู..." 
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-none"
                    />
                </div>
                <button onClick={() => openModal()} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold text-sm hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all">
                    <Plus className="w-5 h-5" />
                    กำหนดสิทธิ์เมนูและฟังก์ชัน
                </button>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider w-[20%]">บทบาท (Role)</th>
                                <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider w-[65%]">สิทธิ์เมนูและฟังก์ชันที่ได้รับ (Menus & Functions)</th>
                                <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right w-[15%]">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto" />
                                        <p className="mt-4 text-sm font-medium text-gray-500">กำลังโหลดข้อมูล...</p>
                                    </td>
                                </tr>
                            ) : currentMenuRoles.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-12 text-center text-sm font-medium text-gray-500">ไม่พบข้อมูล</td>
                                </tr>
                            ) : (
                                currentMenuRoles.map((mr) => (
                                    <tr key={mr.roles_id} className="hover:bg-rose-50/30 transition-colors">
                                        <td className="py-4 px-6 align-top">
                                            <span className="inline-flex py-1.5 px-3 rounded-xl bg-gray-100 text-gray-800 font-black text-sm border border-gray-200 shadow-sm">
                                                {mr.roles_name || '-'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-3">
                                                {mr.menus.map((m: any) => (
                                                    <div key={m.menu_id} className="bg-gray-50 border border-gray-100 p-3 rounded-2xl w-fit min-w-[300px]">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <LayoutList className="w-4 h-4 text-rose-500" />
                                                            <span className="font-bold text-sm text-gray-900">{m.menuname}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5 pl-6">
                                                            {m.has_general_access && (
                                                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                                                    เข้าถึงเมนู
                                                                </span>
                                                            )}
                                                            {m.functions.map((f: any) => (
                                                                <span key={f.function_id} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-gray-600 border border-gray-300 shadow-sm flex items-center gap-1">
                                                                    <Component className="w-3 h-3 text-gray-400" />
                                                                    {f.func_name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right align-top">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openModal(mr)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(mr.roles_id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {!isLoading && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">
                            หน้า {currentPage} จาก {totalPages}
                        </span>
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button 
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                                        currentPage === page ? 'bg-rose-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                    <div className="w-1.5 h-8 bg-rose-500 rounded-full"></div>
                                    กำหนดสิทธิ์การเข้าถึงเมนู
                                </h2>
                                <p className="text-sm text-gray-500 font-medium mt-1 ml-4 text-left">เลือกบทบาท 1 รายการ และติ๊กเลือกเมนู/ฟังก์ชันที่ต้องการให้เข้าถึงสิทธิ์</p>
                            </div>
                            <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30 p-8 flex flex-col gap-6">
                            
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2 shrink-0">
                                <label className="text-sm font-black text-gray-800">1. บทบาท (Role) <span className="text-rose-500">*</span></label>
                                <select 
                                    required
                                    value={formData.roles_id}
                                    onChange={e => setFormData({...formData, roles_id: e.target.value})}
                                    disabled={!!groupedMenuRoles.find(m => String(m.roles_id) === formData.roles_id) && formData.mappings.length > 0} // Disable if editing existing
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-none font-medium text-gray-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <option value="">-- ค้นหาและเลือกบทบาท --</option>
                                    {roles.map(r => (
                                        <option key={r.roles_id} value={r.roles_id}>
                                            {r.roles_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-black text-gray-800">2. กำหนดเมนูและฟังก์ชันย่อย <span className="text-rose-500">*</span></label>
                                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                                        เลือกไว้ {formData.mappings.length} การเข้าถึง
                                    </span>
                                </div>
                                
                                <div className="space-y-4">
                                    {menus.map(menu => {
                                        // Menu Access Checkbox (function_id: null)
                                        const hasMenuAccess = hasMapping(menu.menu_id, null);
                                        
                                        return (
                                            <div key={menu.menu_id} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                                {/* Menu Header */}
                                                <div 
                                                    onClick={() => toggleMapping(menu.menu_id, null)}
                                                    className="px-5 py-4 bg-white border-b border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-rose-50/30 transition-colors group"
                                                >
                                                    <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                                                        hasMenuAccess ? 'bg-rose-500 text-white' : 'border-2 border-gray-300 group-hover:border-rose-400'
                                                    }`}>
                                                        {hasMenuAccess && <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-gray-900 text-sm flex items-center gap-2">
                                                            <LayoutList className="w-4 h-4 text-rose-500" />
                                                            เมนู: {menu.menuname}
                                                        </span>
                                                        <span className="text-xs text-gray-500 font-medium">สิทธิ์เข้าถึงหน้าเมนู (ทั่วไป)</span>
                                                    </div>
                                                </div>

                                                {/* Functions Checkboxes Grid */}
                                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-50/50">
                                                    {functions.map(func => {
                                                        const hasFuncAccess = hasMapping(menu.menu_id, func.function_id);
                                                        return (
                                                            <div 
                                                                key={func.function_id}
                                                                onClick={() => toggleMapping(menu.menu_id, func.function_id)}
                                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none group bg-white ${
                                                                    hasFuncAccess ? 'border-gray-800 shadow-sm' : 'border-gray-100 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <div className={`w-4 h-4 rounded transition-colors flex items-center justify-center ${
                                                                    hasFuncAccess ? 'bg-gray-800 text-white' : 'border border-gray-300 group-hover:border-gray-500'
                                                                }`}>
                                                                    {hasFuncAccess && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className={`text-xs font-bold ${hasFuncAccess ? 'text-gray-900' : 'text-gray-600'}`}>
                                                                        ฟังก์ชัน: {func.func_name}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {menus.length === 0 && (
                                        <p className="text-sm text-gray-500 text-center py-8 bg-white rounded-xl border border-gray-100">โปรดเพิ่มเมนูในแท็บจัดการเมนูก่อน</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-gray-50/90 backdrop-blur-sm -mx-8 px-8 -mb-8 pb-8 z-10">
                                <button type="button" onClick={closeModal} className="px-6 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-200 bg-gray-100 transition-colors shadow-sm">
                                    ยกเลิก
                                </button>
                                <button type="submit" disabled={isSaving || formData.mappings.length === 0} className="flex items-center gap-2 px-8 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 shadow-md shadow-rose-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลและอัปเดตสิทธิ์'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
