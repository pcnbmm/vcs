'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Loader2, Save } from 'lucide-react';

export default function MenuTab() {
    const [menus, setMenus] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    
    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedMenu, setSelectedMenu] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        menuname: '',
        route_path: ''
    });

    useEffect(() => {
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/permissions/menus');
            if (res.ok) {
                const data = await res.json();
                setMenus(data);
            }
        } catch (error) {
            console.error('Error fetching menus:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const filteredMenus = menus.filter(m => 
        (m.menuname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.route_path || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredMenus.length / itemsPerPage);
    const currentMenus = filteredMenus.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const openModal = (mode: 'add' | 'edit', menu?: any) => {
        setModalMode(mode);
        setSelectedMenu(menu);
        if (mode === 'add') {
            setFormData({ menuname: '', route_path: '' });
        } else if (menu) {
            setFormData({ menuname: menu.menuname || '', route_path: menu.route_path || '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({ menuname: '', route_path: '' });
        setSelectedMenu(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.menuname) return alert('กรุณาระบุชื่อเมนู');

        setIsSaving(true);
        try {
            const url = modalMode === 'add' ? '/api/permissions/menus' : `/api/permissions/menus/${selectedMenu.menu_id}`;
            const method = modalMode === 'add' ? 'POST' : 'PUT';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Saving failed');
            
            await fetchMenus();
            closeModal();
        } catch (error) {
            console.error('Error saving menu:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('ยืนยันการลบเมนูนี้ ใช่หรือไม่?')) return;
        try {
            const res = await fetch(`/api/permissions/menus/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Deletion failed');
            await fetchMenus();
        } catch (error) {
            console.error('Error deleting menu:', error);
            alert('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-md shadow-sm border border-gray-100">
                <div className="relative w-full md:w-[400px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อเมนู, URL..." 
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                    />
                </div>
                <button onClick={() => openModal('add')} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">
                    <Plus className="w-5 h-5" />
                    เพิ่มเมนูใหม่
                </button>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">รหัสเมนู</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อเมนู</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">URL (Route path)</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                                        <p className="mt-4 text-sm font-medium text-gray-500">กำลังโหลดข้อมูลเมนู...</p>
                                    </td>
                                </tr>
                            ) : currentMenus.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-sm font-medium text-gray-500">ไม่พบข้อมูล</td>
                                </tr>
                            ) : (
                                currentMenus.map((menu) => (
                                    <tr key={menu.menu_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                                                ID: {menu.menu_id}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="block text-sm font-bold text-gray-900">{menu.menuname}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="block text-sm text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded w-fit">{menu.route_path || '-'}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openModal('edit', menu)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(menu.menu_id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
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
                                        currentPage === page ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
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
                    <div className="relative bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {modalMode === 'add' ? 'เพิ่มเมนูใหม่' : 'แก้ไขเมนู'}
                            </h2>
                            <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">ชื่อเมนู (Menu Name) <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.menuname}
                                        onChange={e => setFormData({...formData, menuname: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none font-medium"
                                        placeholder="เช่น Dashboard, จัดการผู้ใช้"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">Route path (URL)</label>
                                    <input 
                                        type="text"
                                        value={formData.route_path}
                                        onChange={e => setFormData({...formData, route_path: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none font-medium font-mono"
                                        placeholder="เช่น /dashboard"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-md font-bold text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                                    ยกเลิก
                                </button>
                                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-md font-bold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all disabled:opacity-70">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
