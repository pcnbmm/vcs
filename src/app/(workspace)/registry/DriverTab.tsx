'use client';

import { useState, useEffect } from 'react';
import {
    Search, User, Phone, CheckCircle2, ChevronRight, ChevronLeft,
    ChevronsLeft, ChevronsRight, Loader2, AlertCircle, XCircle, Info,
    Plus, Edit, Trash2, ShieldCheck, Briefcase
} from 'lucide-react';

export default function DriverTab({ options }: { options: any }) {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    
    // Form States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        driver_code: '',
        driver_status: 'Y',
        licence_type: '',
        licence_no: '',
        tel: ''
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchDrivers = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/drivers');
            if (!res.ok) throw new Error('Failed to fetch drivers data');
            const data = await res.json();
            setDrivers(data);
            setIsLoading(false);
        } catch (err) {
            console.error("Failed to fetch drivers", err);
            setError("ไม่สามารถโหลดข้อมูลคนขับได้ กรุณาลองใหม่อีกครั้ง");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    const filteredDrivers = drivers.filter(d => {
        const fullName = `${d.vc_users?.firstname || ''} ${d.vc_users?.lastname || ''}`;
        return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               d.licence_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               d.tel?.includes(searchQuery);
    });

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDrivers = filteredDrivers.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const handleOpenForm = (driver: any = null) => {
        if (driver) {
            setEditingDriver(driver);
            setFormData({
                driver_code: driver.driver_code?.toString() || '',
                driver_status: driver.driver_status || 'Y',
                licence_type: driver.licence_type?.toString() || '',
                licence_no: driver.licence_no || '',
                tel: driver.tel || ''
            });
        } else {
            setEditingDriver(null);
            setFormData({
                driver_code: '',
                driver_status: 'Y',
                licence_type: '',
                licence_no: '',
                tel: ''
            });
        }
        setIsFormOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = editingDriver ? `/api/drivers/${editingDriver.driver_id}` : '/api/drivers';
            const method = editingDriver ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const responseData = await res.json();

            if (!res.ok) {
                alert(responseData.error || 'Failed to save');
                setIsSaving(false);
                return;
            }
            
            setIsFormOpen(false);
            fetchDrivers();
        } catch (error) {
            console.error(error);
            alert("บันทึกข้อมูลไม่สำเร็จ");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลคนขับคนนี้?")) return;
        
        try {
            const res = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            fetchDrivers();
            setSelectedDriver(null);
        } catch (error) {
            console.error(error);
            alert("ลบข้อมูลไม่สำเร็จ ข้อมูลอาจถูกใช้งานอยู่");
        }
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6 animate-in slide-in-from-right-8 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-50 gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                    <h2 className="text-xl font-bold text-gray-900">รายชื่อพนักงานขับรถ</h2>
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest ml-2">
                        ทั้งหมด {filteredDrivers.length} คน
                    </span>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ค้นหาชื่อ, ใบขับขี่, เบอร์โทร..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-gray-900"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                    <button
                        onClick={() => handleOpenForm()}
                        className="flex-shrink-0 h-12 px-6 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95 shadow-indigo-200"
                    >
                        <Plus size={20} />
                        เพิ่มคนขับ
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                    <Loader2 size={48} className="text-indigo-600 animate-spin" />
                    <p className="font-bold text-lg text-gray-500">กำลังโหลดข้อมูลคนขับ...</p>
                </div>
            ) : error ? (
                <div className="bg-rose-50 p-16 rounded-[2rem] text-center border border-rose-100 flex flex-col items-center gap-4">
                    <AlertCircle size={48} className="text-rose-500" />
                    <p className="font-bold text-lg text-rose-600">{error}</p>
                </div>
            ) : filteredDrivers.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                    <User size={48} className="text-gray-200" />
                    <p className="font-black text-xl text-gray-400 uppercase tracking-widest">
                        {searchQuery ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูลในระบบ'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="overflow-x-auto rounded-[1.5rem] border border-gray-100 shadow-sm bg-white">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr>
                                    <th className="py-4 px-5 font-black text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100">ID</th>
                                    <th className="py-4 px-5 font-black text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100">ชื่อ - นามสกุล</th>
                                    <th className="py-4 px-5 font-black text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100">เบอร์โทรศัพท์</th>
                                    <th className="py-4 px-5 font-black text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100">เลขใบขับขี่</th>
                                    <th className="py-4 px-5 font-black text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100">ประเภทใบขับขี่</th>
                                    <th className="py-4 px-5 font-black text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100">สถานะ</th>
                                    <th className="py-4 px-5 font-black text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedDrivers.map((driver) => {
                                    const user = driver.vc_users;
                                    const licenseType = driver.vc_driver_license_type;
                                    const isAvailable = driver.driver_status === 'Y';
                                    const statusColor = isAvailable ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-100 border-slate-200';
                                    const StatusIcon = isAvailable ? CheckCircle2 : Info;
                                    const fullName = user ? `${user.firstname || ''} ${user.lastname || ''}` : 'ไม่ระบุชื่อ';

                                    return (
                                        <tr key={driver.driver_id} className="group hover:bg-indigo-50/30 transition-colors bg-white">
                                            <td className="py-4 px-5 cursor-pointer" onClick={() => setSelectedDriver(driver)}>
                                                <span className="text-[11px] font-black text-indigo-400 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                                                    {driver.driver_id}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 cursor-pointer" onClick={() => setSelectedDriver(driver)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                        {user?.firstname?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-black text-gray-900">{fullName}</span>
                                                        <span className="block text-xs text-gray-500 font-medium">รหัสพนง: {driver.driver_code || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 cursor-pointer" onClick={() => setSelectedDriver(driver)}>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-gray-400" />
                                                    <span className="text-sm font-bold text-slate-700">{driver.tel || user?.mobile_no || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 cursor-pointer" onClick={() => setSelectedDriver(driver)}>
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck size={14} className="text-indigo-400" />
                                                    <span className="text-sm font-bold text-slate-800">{driver.licence_no || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 cursor-pointer" onClick={() => setSelectedDriver(driver)}>
                                                <span className="text-sm font-bold text-gray-600 truncate max-w-[150px] inline-block">
                                                    {licenseType?.license_type_name || '-'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 cursor-pointer" onClick={() => setSelectedDriver(driver)}>
                                                <div className={`
                                                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-tighter shadow-sm
                                                    ${statusColor}
                                                `}>
                                                    <StatusIcon size={12} className="shrink-0" />
                                                    {isAvailable ? 'พร้อมทำงาน' : 'ไม่ว่าง/พัก'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleOpenForm(driver); }}
                                                        className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 flex items-center justify-center transition-colors"
                                                        title="แก้ไขข้อมูล"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(driver.driver_id); }}
                                                        className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors"
                                                        title="ลบข้อมูล"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setSelectedDriver(driver); }}
                                                        className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                                                        title="ดูรายละเอียด"
                                                    >
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-gray-50">
                            <div className="text-sm text-gray-500 font-bold">
                                แสดง {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredDrivers.length)} จาก {filteredDrivers.length} รายการ
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 transition-colors"><ChevronsLeft size={18} /></button>
                                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 transition-colors"><ChevronLeft size={18} /></button>
                                <div className="px-5 py-2.5 text-sm font-black bg-indigo-600 text-white rounded-xl shadow-md min-w-[5rem] text-center tracking-widest">{currentPage} <span className="opacity-50">/</span> {totalPages}</div>
                                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 transition-colors"><ChevronRight size={18} /></button>
                                <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 transition-colors"><ChevronsRight size={18} /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Read/View Detail Modal */}
            {selectedDriver && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="bg-indigo-900 p-8 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-800 rounded-2xl flex items-center justify-center shadow-lg shadow-white/10">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">
                                        {selectedDriver.vc_users?.firstname || ''} {selectedDriver.vc_users?.lastname || 'ไม่ระบุชื่อ'}
                                    </h2>
                                    <p className="text-indigo-300 text-xs font-black uppercase tracking-widest">DRIVER ID: {selectedDriver.driver_id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDriver(null)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all group">
                                <XCircle size={24} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        <div className="p-10 overflow-y-auto space-y-10 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <DetailCard label="ประเภทใบขับขี่" value={selectedDriver.vc_driver_license_type?.license_type_name || '-'} subValue="License Type" icon={Briefcase} color="text-indigo-600 bg-indigo-50" />
                                <DetailCard label="เลขใบขับขี่" value={selectedDriver.licence_no || '-'} subValue="License No" icon={ShieldCheck} color="text-indigo-600 bg-indigo-50" />
                                <DetailCard label="เบอร์ติดต่อ" value={selectedDriver.tel || selectedDriver.vc_users?.mobile_no || '-'} subValue="Mobile" icon={Phone} color="text-indigo-600 bg-indigo-50" />
                                <DetailCard label="สถานะ" value={selectedDriver.driver_status === 'Y' ? 'พร้อมทำงาน' : 'ไม่พร้อมทำงาน'} subValue="Status" icon={CheckCircle2} color={selectedDriver.driver_status === 'Y' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 bg-slate-50'} />
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 flex justify-between shrink-0 border-t border-gray-100 items-center">
                            <div className="flex gap-2">
                                <button onClick={() => { setSelectedDriver(null); handleOpenForm(selectedDriver); }} className="px-6 py-3 bg-orange-100 text-orange-700 rounded-2xl font-bold flex items-center gap-2 hover:bg-orange-200 transition-colors">
                                    <Edit size={18} /> แก้ไข
                                </button>
                                <button onClick={() => { handleDelete(selectedDriver.driver_id); }} className="px-6 py-3 bg-rose-100 text-rose-700 rounded-2xl font-bold flex items-center gap-2 hover:bg-rose-200 transition-colors">
                                    <Trash2 size={18} /> ลบ
                                </button>
                            </div>
                            <button onClick={() => setSelectedDriver(null)} className="px-10 py-4 bg-indigo-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-950 transition-all shadow-xl active:scale-95 shadow-indigo-200">
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Modal for Add / Edit */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
                        <div className="bg-white p-6 md:p-8 flex justify-between items-center shrink-0 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                                    {editingDriver ? <Edit className="w-6 h-6 text-indigo-600" /> : <Plus className="w-6 h-6 text-indigo-600" />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">
                                        {editingDriver ? 'แก้ไขข้อมูลคนขับ' : 'เพิ่มข้อมูลคนขับใหม่'}
                                    </h2>
                                    <p className="text-gray-500 text-sm font-medium">ระบุพนักงานและข้อมูลใบขับขี่</p>
                                </div>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                            <form id="driver-form" onSubmit={handleSave} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">พนักงาน / ผู้ใช้งาน <span className="text-rose-500">*</span></label>
                                    <select 
                                        required 
                                        value={formData.driver_code} 
                                        onChange={(e) => setFormData({...formData, driver_code: e.target.value})} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all shadow-sm"
                                        disabled={!!editingDriver} // Usually don't allow changing user once created
                                    >
                                        <option value="">-- เลือกพนักงาน --</option>
                                        {options?.users?.map((u: any) => (
                                            <option key={u.userid} value={u.userid}>{u.userid} - {u.firstname} {u.lastname}</option>
                                        ))}
                                    </select>
                                    {editingDriver && <p className="text-xs text-orange-500 font-bold ml-2 mt-1">ไม่สามารถเปลี่ยนรหัสพนักงานได้เมื่อสร้างแล้ว</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">ประเภทใบอนุญาตขับขี่</label>
                                        <select value={formData.licence_type} onChange={(e) => setFormData({...formData, licence_type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all shadow-sm">
                                            <option value="">-- เลือกประเภท --</option>
                                            {options?.licenseTypes?.map((l: any) => (
                                                <option key={l.license_type_id} value={l.license_type_id}>{l.license_type_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">สถานะพร้อมทำงาน</label>
                                        <select required value={formData.driver_status} onChange={(e) => setFormData({...formData, driver_status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all shadow-sm">
                                            <option value="Y">พร้อมทำงาน</option>
                                            <option value="N">ไม่พร้อมทำงาน / ลาพัก</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">เลขที่ใบอนุญาตขับขี่</label>
                                        <input type="text" value={formData.licence_no} onChange={(e) => setFormData({...formData, licence_no: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all shadow-sm" placeholder="เช่น 12345678" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">เบอร์โทรศัพท์ (สำรอง)</label>
                                        <input type="text" value={formData.tel} onChange={(e) => setFormData({...formData, tel: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all shadow-sm" placeholder="08x-xxx-xxxx" />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="bg-slate-50 p-6 flex justify-end shrink-0 border-t border-gray-100 gap-3">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 bg-white border border-gray-200 text-slate-700 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm">
                                ยกเลิก
                            </button>
                            <button type="submit" form="driver-form" disabled={isSaving} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-indigo-200">
                                {isSaving && <Loader2 size={18} className="animate-spin" />}
                                บันทึกข้อมูล
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Reusable components
function DetailCard({ label, value, subValue, icon: Icon, color }: any) {
    return (
        <div className="p-6 rounded-[2rem] border border-gray-100 bg-gray-50/30 flex flex-col h-full">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}><Icon size={20} /></div>
            <div className="mt-auto">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-base font-black text-gray-900 leading-tight mb-0.5 break-words">{value}</p>
                <p className="text-xs text-gray-500 font-bold truncate">{subValue}</p>
            </div>
        </div>
    );
}
