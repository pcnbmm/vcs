'use client';

import { useState, useEffect } from 'react';
import {
    Search, Car, Settings, CalendarDays, ChevronRight, ChevronLeft,
    ChevronsLeft, ChevronsRight, Loader2, AlertCircle, CheckCircle2,
    XCircle, Info, Plus, Edit, Trash2, Activity, CreditCard
} from 'lucide-react';

export default function VehicleTab({ options }: { options: any }) {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    
    // Form States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        car_number: '',
        car_brand_id: '',
        color_id: '',
        car_status_id: '',
        regis_date: '',
        fleetcard_no: '',
        body_no: '',
        machine_no: '',
        cylinder_capacityp: '',
        horse_power: '',
        weight: ''
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchVehicles = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/vehicles');
            if (!res.ok) throw new Error('Failed to fetch vehicles data');
            const data = await res.json();
            setVehicles(data);
            setIsLoading(false);
        } catch (err) {
            console.error("Failed to fetch vehicles", err);
            setError("ไม่สามารถโหลดข้อมูลทะเบียนรถได้ กรุณาลองใหม่อีกครั้ง");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const filteredVehicles = vehicles.filter(v => {
        return v.car_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               v.car_brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               v.car_series_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               v.car_status_name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedVehicles = filteredVehicles.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const handleOpenForm = (vehicle: any = null) => {
        if (vehicle) {
            setEditingVehicle(vehicle);
            setFormData({
                car_number: vehicle.car_number || '',
                car_brand_id: vehicle.car_brand_id?.toString() || '',
                color_id: vehicle.color_id?.toString() || '',
                car_status_id: vehicle.car_status_id?.toString() || '',
                regis_date: vehicle.regis_date || '',
                fleetcard_no: vehicle.fleetcard_no || '',
                body_no: vehicle.body_no || '',
                machine_no: vehicle.machine_no || '',
                cylinder_capacityp: vehicle.cylinder_capacityp || '',
                horse_power: vehicle.horse_power || '',
                weight: vehicle.weight || ''
            });
        } else {
            setEditingVehicle(null);
            setFormData({
                car_number: '', car_brand_id: '', color_id: '', car_status_id: '',
                regis_date: '', fleetcard_no: '', body_no: '', machine_no: '',
                cylinder_capacityp: '', horse_power: '', weight: ''
            });
        }
        setIsFormOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = editingVehicle ? `/api/vehicles/${editingVehicle.car_id}` : '/api/vehicles';
            const method = editingVehicle ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to save');
            
            setIsFormOpen(false);
            fetchVehicles();
        } catch (error) {
            console.error(error);
            alert("บันทึกข้อมูลไม่สำเร็จ");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลรถยนต์คันนี้?")) return;
        
        try {
            const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            fetchVehicles();
            setSelectedVehicle(null);
        } catch (error) {
            console.error(error);
            alert("ลบข้อมูลไม่สำเร็จ ข้อมูลอาจถูกใช้งานอยู่");
        }
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-50 gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-slate-800 rounded-full"></div>
                    <h2 className="text-xl font-bold text-gray-900">รายการรถยนต์</h2>
                    <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest ml-2">
                        ทั้งหมด {filteredVehicles.length} คัน
                    </span>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ค้นหาทะเบียน, ยี่ห้อ หรือสถานะ..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all font-medium text-gray-900"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                    <button
                        onClick={() => handleOpenForm()}
                        className="flex-shrink-0 h-12 px-6 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95"
                    >
                        <Plus size={20} />
                        เพิ่มรถยนต์
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                    <Loader2 size={48} className="text-slate-800 animate-spin" />
                    <p className="font-bold text-lg text-gray-500">กำลังโหลดข้อมูล...</p>
                </div>
            ) : error ? (
                <div className="bg-rose-50 p-16 rounded-[2rem] text-center border border-rose-100 flex flex-col items-center gap-4">
                    <AlertCircle size={48} className="text-rose-500" />
                    <p className="font-bold text-lg text-rose-600">{error}</p>
                </div>
            ) : filteredVehicles.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                    <Car size={48} className="text-gray-200" />
                    <p className="font-black text-xl text-gray-400 uppercase tracking-widest">
                        {searchQuery ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูลในระบบ'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="overflow-x-auto rounded-[1.5rem] border border-gray-100 shadow-sm bg-white">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr>
                                    <th className="py-4 px-5 font-black text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100">ID</th>
                                    <th className="py-4 px-5 font-black text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100">ทะเบียน</th>
                                    <th className="py-4 px-5 font-black text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100">ยี่ห้อ / รุ่น</th>
                                    <th className="py-4 px-5 font-black text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100">สีรถ</th>
                                    <th className="py-4 px-5 font-black text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100">จดทะเบียน</th>
                                    <th className="py-4 px-5 font-black text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100">สถานะ</th>
                                    <th className="py-4 px-5 font-black text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedVehicles.map((vehicle) => {
                                    const isAvailable = vehicle.car_status_name === 'ใช้งานได้' || vehicle.car_status_name?.toLowerCase().includes('active') || vehicle.car_status_id === 1;
                                    const statusColor = isAvailable ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-100 border-slate-200';
                                    const StatusIcon = isAvailable ? CheckCircle2 : Info;

                                    return (
                                        <tr key={vehicle.car_id} className="group hover:bg-slate-50/50 transition-colors bg-white">
                                            <td className="py-4 px-5 cursor-pointer" onClick={() => setSelectedVehicle(vehicle)}>
                                                <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/50">
                                                    {vehicle.car_id}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 cursor-pointer" onClick={() => setSelectedVehicle(vehicle)}>
                                                <span className="text-sm font-black text-gray-900">{vehicle.car_number || '-'}</span>
                                            </td>
                                            <td className="py-4 px-5 cursor-pointer" onClick={() => setSelectedVehicle(vehicle)}>
                                                <span className="text-sm font-bold text-gray-600">
                                                    {vehicle.car_brand_name || 'ไม่มียี่ห้อ'} {vehicle.car_series_name || ''}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 cursor-pointer" onClick={() => setSelectedVehicle(vehicle)}>
                                                <div className="flex items-center gap-2">
                                                    <Settings size={14} className="text-gray-400" />
                                                    <span className="text-sm font-bold text-gray-800">{vehicle.color_name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 cursor-pointer" onClick={() => setSelectedVehicle(vehicle)}>
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays size={14} className="text-gray-400" />
                                                    <span className="text-sm font-bold text-gray-800">{vehicle.regis_date || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 cursor-pointer" onClick={() => setSelectedVehicle(vehicle)}>
                                                <div className={`
                                                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-tighter shadow-sm
                                                    ${statusColor}
                                                `}>
                                                    <StatusIcon size={12} className="shrink-0" />
                                                    {vehicle.car_status_name || 'ไม่ระบุสถานะ'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleOpenForm(vehicle); }}
                                                        className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 flex items-center justify-center transition-colors"
                                                        title="แก้ไขข้อมูล"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(vehicle.car_id); }}
                                                        className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors"
                                                        title="ลบข้อมูล"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setSelectedVehicle(vehicle); }}
                                                        className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-slate-800 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all shadow-sm"
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
                                แสดง {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredVehicles.length)} จาก {filteredVehicles.length} รายการ
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 transition-colors"><ChevronsLeft size={18} /></button>
                                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 transition-colors"><ChevronLeft size={18} /></button>
                                <div className="px-5 py-2.5 text-sm font-black bg-slate-800 text-white rounded-xl shadow-md min-w-[5rem] text-center tracking-widest">{currentPage} <span className="opacity-50">/</span> {totalPages}</div>
                                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 transition-colors"><ChevronRight size={18} /></button>
                                <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 transition-colors"><ChevronsRight size={18} /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Read/View Detail Modal */}
            {selectedVehicle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center shadow-lg shadow-white/10">
                                    <Car className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">
                                        {selectedVehicle.car_number || 'ไม่ระบุทะเบียน'}
                                    </h2>
                                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">CAR MASTER ID: {selectedVehicle.car_id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedVehicle(null)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all group">
                                <XCircle size={24} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        <div className="p-10 overflow-y-auto space-y-10 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <DetailCard label="ยี่ห้อ / รุ่น" value={selectedVehicle.car_brand_name || '-'} subValue={selectedVehicle.car_series_name || '-'} icon={Car} color="text-slate-600 bg-slate-50" />
                                <DetailCard label="สีรถ" value={selectedVehicle.color_name || '-'} subValue="Color" icon={Settings} color="text-slate-600 bg-slate-50" />
                                <DetailCard label="เลขบัตร Fleetcard" value={selectedVehicle.fleetcard_no || '-'} subValue="Fleetcard No" icon={CreditCard} color="text-slate-600 bg-slate-50" />
                                <DetailCard label="สถานะ" value={selectedVehicle.car_status_name || '-'} subValue="Current Status" icon={Activity} color={(selectedVehicle.car_status_name === 'ใช้งานได้' || selectedVehicle.car_status_id === 1) ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 bg-slate-50'} />
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                    <div className="w-2 h-6 bg-slate-400 rounded-full"></div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">รายละเอียดเพิ่มเติม (Details)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <ReadOnlyField label="เลขตัวถัง (Body No)" value={selectedVehicle.body_no || '-'} />
                                    <ReadOnlyField label="เลขเครื่องยนต์ (Machine No)" value={selectedVehicle.machine_no || '-'} />
                                    <ReadOnlyField label="ความจุเครื่องยนต์ (CC)" value={selectedVehicle.cylinder_capacityp || '-'} />
                                    <ReadOnlyField label="แรงม้า (Horse Power)" value={selectedVehicle.horse_power || '-'} />
                                    <ReadOnlyField label="น้ำหนัก (Weight)" value={selectedVehicle.weight || '-'} />
                                    <ReadOnlyField label="วันที่จดทะเบียน" value={selectedVehicle.regis_date || '-'} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 flex justify-between shrink-0 border-t border-gray-100 items-center">
                            <div className="flex gap-2">
                                <button onClick={() => { setSelectedVehicle(null); handleOpenForm(selectedVehicle); }} className="px-6 py-3 bg-orange-100 text-orange-700 rounded-2xl font-bold flex items-center gap-2 hover:bg-orange-200 transition-colors">
                                    <Edit size={18} /> แก้ไข
                                </button>
                                <button onClick={() => { handleDelete(selectedVehicle.car_id); }} className="px-6 py-3 bg-rose-100 text-rose-700 rounded-2xl font-bold flex items-center gap-2 hover:bg-rose-200 transition-colors">
                                    <Trash2 size={18} /> ลบ
                                </button>
                            </div>
                            <button onClick={() => setSelectedVehicle(null)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
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
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                    {editingVehicle ? <Edit className="w-6 h-6 text-slate-700" /> : <Plus className="w-6 h-6 text-slate-700" />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">
                                        {editingVehicle ? 'แก้ไขข้อมูลรถยนต์' : 'เพิ่มข้อมูลรถยนต์ใหม่'}
                                    </h2>
                                    <p className="text-gray-500 text-sm font-medium">กรอกข้อมูลให้ครบถ้วนเพื่อบันทึกเข้าระบบ</p>
                                </div>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                            <form id="vehicle-form" onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">ทะเบียนรถ <span className="text-rose-500">*</span></label>
                                        <input required type="text" value={formData.car_number} onChange={(e) => setFormData({...formData, car_number: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all shadow-sm" placeholder="เช่น กข 1234 กทม." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">ยี่ห้อรถ</label>
                                        <select value={formData.car_brand_id} onChange={(e) => setFormData({...formData, car_brand_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all shadow-sm">
                                            <option value="">-- เลือกยี่ห้อรถ --</option>
                                            {options?.carBrands?.map((b: any) => (
                                                <option key={b.car_brand_id} value={b.car_brand_id}>{b.car_brand_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">สีรถ</label>
                                        <select value={formData.color_id} onChange={(e) => setFormData({...formData, color_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all shadow-sm">
                                            <option value="">-- เลือกสีรถ --</option>
                                            {options?.colors?.map((c: any) => (
                                                <option key={c.color_id} value={c.color_id}>{c.color_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">สถานะ</label>
                                        <select value={formData.car_status_id} onChange={(e) => setFormData({...formData, car_status_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all shadow-sm">
                                            <option value="">-- เลือกสถานะ --</option>
                                            {options?.statuses?.map((s: any) => (
                                                <option key={s.car_status_id} value={s.car_status_id}>{s.car_status_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">วันที่จดทะเบียน</label>
                                        <input type="date" value={formData.regis_date} onChange={(e) => setFormData({...formData, regis_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all shadow-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">เลขบัตร Fleetcard</label>
                                        <input type="text" value={formData.fleetcard_no} onChange={(e) => setFormData({...formData, fleetcard_no: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all shadow-sm" />
                                    </div>
                                    
                                </div>
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <h3 className="font-bold text-gray-900 text-sm tracking-widest uppercase">รายละเอียดเชิงเทคนิค</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 ml-1">เลขตัวถัง</label>
                                            <input type="text" value={formData.body_no} onChange={(e) => setFormData({...formData, body_no: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 ml-1">เลขเครื่องยนต์</label>
                                            <input type="text" value={formData.machine_no} onChange={(e) => setFormData({...formData, machine_no: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="bg-slate-50 p-6 flex justify-end shrink-0 border-t border-gray-100 gap-3">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 bg-white border border-gray-200 text-slate-700 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm">
                                ยกเลิก
                            </button>
                            <button type="submit" form="vehicle-form" disabled={isSaving} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
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

function ReadOnlyField({ label, value }: { label: string, value: string }) {
    return (
        <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{label} :</label>
            <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 shadow-inner break-words">
                {value}
            </div>
        </div>
    );
}
