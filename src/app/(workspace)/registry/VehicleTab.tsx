"use client";
import { showSuccess, showError, showWarning, showConfirm } from "@/lib/sweetalert";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, X, Loader2, Save, Filter } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function VehicleTab() {
    const { hasAccess } = usePermissions();
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [options, setOptions] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    
    // Pagination & Search
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [searchQuery, setSearchQuery] = useState('');

    // Filters & Sorting
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterProvince, setFilterProvince] = useState('');
    const [filterColor, setFilterColor] = useState('');
    const [filterSpec, setFilterSpec] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterTypeRegis, setFilterTypeRegis] = useState('');
    const [filterBrand, setFilterBrand] = useState('');

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'view' | 'add' | 'edit'>('add');
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        fetchData();
        fetchOptions();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/vehicles');
            if (!res.ok) throw new Error('Failed to fetch vehicles data');
            const data = await res.json();
            setVehicles(data);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const res = await fetch('/api/options');
            if (res.ok) {
                const data = await res.json();
                setOptions(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // Apply all filters + search + sorting
    const filteredVehicles = vehicles.filter(v => {
        const fullStr = `${v.car_number} ${v.car_brand_name} ${v.car_series_name} ${v.car_status_name}`.toLowerCase();
        const matchSearch = fullStr.includes(searchQuery.toLowerCase());
        
        const matchStatus = filterStatus ? String(v.car_status_id) === String(filterStatus) : true;
        const matchProvince = filterProvince ? String(v.car_province_id) === String(filterProvince) : true;
        const matchColor = filterColor ? String(v.color_id) === String(filterColor) : true;
        const matchSpec = filterSpec ? String(v.car_spec_id) === String(filterSpec) : true;
        const matchType = filterType ? String(v.car_type_id) === String(filterType) : true;
        const matchTypeRegis = filterTypeRegis ? String(v.car_type_regis_id) === String(filterTypeRegis) : true;
        const matchBrand = filterBrand ? String(v.car_brand_id) === String(filterBrand) : true;

        return matchSearch && matchStatus && matchProvince && matchColor && matchSpec && matchType && matchTypeRegis && matchBrand;
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        const key = sortConfig.key;
        if (a[key] < b[key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
    const currentVehicles = filteredVehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
    };

    const jumpPages = (amount: number) => {
        let newPage = currentPage + amount;
        if (newPage < 1) newPage = 1;
        if (newPage > totalPages) newPage = totalPages;
        setCurrentPage(newPage);
    };

    const safeDate = (dateVal: any) => {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    };

    const openModal = (mode: 'view' | 'add' | 'edit', vehicle?: any) => {
        setModalMode(mode);
        setSelectedVehicle(vehicle);
        if (mode === 'add') {
            setFormData({
                car_number: '', car_brand_id: '', color_id: '', car_status_id: '',
                car_province_id: '', car_type_id: '', car_spec_id: '', car_type_regis_id: '',
                regis_date: '', fleetcard_no: '', body_no: '', machine_no: '',
                cylinder_capacityp: '', horse_power: '', weight: '', own_div_code: '',
                fiscal_year: '', start_date: '', end_date: '', oil_expense: '', refund_vat: '',
                flag: '', ref_car: '', machine_id: '', oil_type_id: ''
            });
        } else {
            setFormData({
                ...vehicle,
                regis_date: safeDate(vehicle.regis_date),
                start_date: safeDate(vehicle.start_date),
                end_date: safeDate(vehicle.end_date),
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({});
        setSelectedVehicle(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const url = modalMode === 'add' ? '/api/vehicles' : `/api/vehicles/${selectedVehicle.car_id}`;
            const method = modalMode === 'add' ? 'POST' : 'PUT';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Saving failed');
            
            await fetchData();
            closeModal();
        } catch (error) {
            console.error('Error saving vehicle:', error);
            showError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!(await showConfirm('ยืนยันการลบข้อมูลรถยนต์คันนี้ ใช่หรือไม่?'))) return;
        try {
            const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Deletion failed');
            await fetchData();
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            showError('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filters Area */}
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <h3 className="font-bold text-gray-700">ตัวกรองข้อมูล (Filters)</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <SelectFilter label="ยี่ห้อรถ" value={filterBrand} onChange={setFilterBrand} options={options?.carBrands} valKey="car_brand_id" lblKey="car_brand_name" />
                    <SelectFilter label="สถานะ" value={filterStatus} onChange={setFilterStatus} options={options?.statuses} valKey="car_status_id" lblKey="car_status_name" />
                    <SelectFilter label="จังหวัด" value={filterProvince} onChange={setFilterProvince} options={options?.provinces} valKey="province_id" lblKey="province_name" />
                    <SelectFilter label="สีรถ" value={filterColor} onChange={setFilterColor} options={options?.colors} valKey="color_id" lblKey="color_name" />
                    <SelectFilter label="สเปค" value={filterSpec} onChange={setFilterSpec} options={options?.carSpecs} valKey="car_spec_id" lblKey="car_spec_name" />
                    <SelectFilter label="ประเภทรถ" value={filterType} onChange={setFilterType} options={options?.carTypes} valKey="car_type_id" lblKey="car_type_name" />
                    <SelectFilter label="ประเภทจดทะเบียน" value={filterTypeRegis} onChange={setFilterTypeRegis} options={options?.typeRegis} valKey="type_regis_id" lblKey="type_regis_name" />
                </div>
            </div>

            {/* Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-md shadow-sm border border-gray-100">
                <div className="relative w-full md:w-[400px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาทะเบียน, ยี่ห้อ, สถานะ..." 
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                    />
                </div>
                {hasAccess('create') && (
                    <button onClick={() => openModal('add')} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                        <Plus className="w-5 h-5" />
                        เพิ่มข้อมูลรถยนต์
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th onClick={() => handleSort('car_number')} className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                                    ทะเบียนรถ {sortConfig?.key === 'car_number' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('car_brand_name')} className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                                    ยี่ห้อ / สเปค {sortConfig?.key === 'car_brand_name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('color_name')} className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                                    สีรถ {sortConfig?.key === 'color_name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('car_status_name')} className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                                    สถานะ {sortConfig?.key === 'car_status_name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                                        <p className="mt-4 text-sm font-medium text-gray-500">กำลังโหลดข้อมูลรถยนต์...</p>
                                    </td>
                                </tr>
                            ) : currentVehicles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center">
                                        <p className="text-sm font-medium text-gray-500">ไม่พบข้อมูลที่ค้นหา</p>
                                    </td>
                                </tr>
                            ) : (
                                currentVehicles.map((vehicle) => (
                                    <tr key={vehicle.car_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <span className="block text-sm font-semibold text-gray-900">{vehicle.car_number || '-'}</span>
                                            <span className="block text-xs font-bold text-gray-500">{vehicle.province_name}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="block text-sm font-bold text-gray-800">{vehicle.car_brand_name || '-'}</span>
                                            <span className="block text-xs text-gray-500 mt-0.5">{vehicle.car_spec_name || '-'}</span>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-600">
                                            {vehicle.color_name || '-'}
                                        </td>
                                        <td className="py-4 px-6">
                                            {(() => {
                                                const status = vehicle.car_status_name || '';
                                                let colorClass = 'bg-slate-50 text-slate-700 border-slate-100';
                                                let dotClass = 'bg-slate-500';

                                                if (status.includes('ปกติ') || status.includes('พร้อม') || status.includes('ใช้งานอยู่')) {
                                                    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                                                    dotClass = 'bg-emerald-500';
                                                } else if (status.includes('ซ่อม') || status.includes('บำรุง')) {
                                                    colorClass = 'bg-amber-50 text-amber-700 border-amber-100';
                                                    dotClass = 'bg-amber-500';
                                                } else if (status.includes('ยกเลิก') || status.includes('จำหน่าย')) {
                                                    colorClass = 'bg-rose-50 text-rose-700 border-rose-100';
                                                    dotClass = 'bg-rose-500';
                                                } else if (status.includes('จอง')) {
                                                    colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                                                    dotClass = 'bg-indigo-500';
                                                }

                                                return (
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorClass} shadow-sm uppercase tracking-tight`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass} animate-pulse`}></span>
                                                        {status || '-'}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {hasAccess('view') && (
                                                    <button onClick={() => openModal('view', vehicle)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {hasAccess('update') && (
                                                    <button onClick={() => openModal('edit', vehicle)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {hasAccess('delete') && (
                                                    <button onClick={() => handleDelete(vehicle.car_id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
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
                            แสดง {((currentPage - 1) * itemsPerPage) + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredVehicles.length)} จาก {filteredVehicles.length} รายการ
                        </span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => jumpPages(-5)} disabled={currentPage <= 1} className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors">-5 หน้า</button>
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors">ก่อนหน้า</button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((page, index, array) => (
                                    <React.Fragment key={page}>
                                        {index > 0 && array[index - 1] !== page - 1 && <span className="px-2 text-gray-400">...</span>}
                                        <button 
                                            onClick={() => handlePageChange(page)}
                                            className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                                                currentPage === page ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    </React.Fragment>
                                ))
                            }
                            
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors">ถัดไป</button>
                            <button onClick={() => jumpPages(5)} disabled={currentPage >= totalPages} className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors">+5 หน้า</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white z-10 shadow-sm relative">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
                                {modalMode === 'add' ? 'เพิ่มข้อมูลรถยนต์' : modalMode === 'edit' ? 'แก้ไขข้อมูลรถยนต์' : 'รายละเอียดรถยนต์'}
                            </h2>
                            <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors absolute right-6 top-1/2 -translate-y-1/2">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
                            <div className="space-y-6">
                                <FormSection title="หมวดข้อมูลหลัก (Main Identity)">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        <InputField label="ทะเบียนรถ" required value={formData.car_number} onChange={(v:any) => setFormData({...formData, car_number: v})} placeholder="เช่น กข 1234" disabled={modalMode === 'view'} />
                                        <SelectField label="จังหวัด" required value={formData.car_province_id} onChange={(v:any) => setFormData({...formData, car_province_id: v})} options={options?.provinces} valueKey="province_id" labelKey="province_name" disabled={modalMode === 'view'} />
                                        <SelectField label="ประเภทรถ" value={formData.car_type_id} onChange={(v:any) => setFormData({...formData, car_type_id: v})} options={options?.carTypes} valueKey="car_type_id" labelKey="car_type_name" disabled={modalMode === 'view'} />
                                        
                                        <SelectField label="ยี่ห้อรถ" value={formData.car_brand_id} onChange={(v:any) => setFormData({...formData, car_brand_id: v})} options={options?.carBrands} valueKey="car_brand_id" labelKey="car_brand_name" disabled={modalMode === 'view'} />
                                        <SelectField label="สเปค" value={formData.car_spec_id} onChange={(v:any) => setFormData({...formData, car_spec_id: v})} options={options?.carSpecs} valueKey="car_spec_id" labelKey="car_spec_name" disabled={modalMode === 'view'} />
                                        <SelectField label="สีรถ" value={formData.color_id} onChange={(v:any) => setFormData({...formData, color_id: v})} options={options?.colors} valueKey="color_id" labelKey="color_name" disabled={modalMode === 'view'} />
                                        
                                        <SelectField label="ประเภทจดทะเบียน" value={formData.car_type_regis_id} onChange={(v:any) => setFormData({...formData, car_type_regis_id: v})} options={options?.typeRegis} valueKey="type_regis_id" labelKey="type_regis_name" disabled={modalMode === 'view'} />
                                        <SelectField label="สถานะรถ" required value={formData.car_status_id} onChange={(v:any) => setFormData({...formData, car_status_id: v})} options={options?.statuses} valueKey="car_status_id" labelKey="car_status_name" disabled={modalMode === 'view'} />
                                    </div>
                                </FormSection>

                                <FormSection title="หมวดวันที่และรายละเอียด (Dates & Details)">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        <InputField label="วันที่จดทะเบียน (Regis Date)" type="date" value={formData.regis_date} onChange={(v:any) => setFormData({...formData, regis_date: v})} disabled={modalMode === 'view'} />
                                        <InputField label="ปีงบประมาณ (Fiscal Year)" type="number" value={formData.fiscal_year} onChange={(v:any) => setFormData({...formData, fiscal_year: v})} placeholder="เช่น 2567" disabled={modalMode === 'view'} />
                                        <InputField label="วันที่เริ่มต้น (Start Date)" type="date" value={formData.start_date} onChange={(v:any) => setFormData({...formData, start_date: v})} disabled={modalMode === 'view'} />
                                        <InputField label="วันที่สิ้นสุด (End Date)" type="date" value={formData.end_date} onChange={(v:any) => setFormData({...formData, end_date: v})} disabled={modalMode === 'view'} />
                                    </div>
                                </FormSection>

                                <FormSection title="หมวดเครื่องยนต์และตัวถัง (Engine & Body)">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        <InputField label="หมายเลขเครื่อง (Machine No)" value={formData.machine_no} onChange={(v:any) => setFormData({...formData, machine_no: v})} disabled={modalMode === 'view'} />
                                        <InputField label="หมายเลขตัวถัง (Body No)" value={formData.body_no} onChange={(v:any) => setFormData({...formData, body_no: v})} disabled={modalMode === 'view'} />
                                        <InputField label="รหัสเครื่องยนต์ (Machine ID)" value={formData.machine_id} onChange={(v:any) => setFormData({...formData, machine_id: v})} disabled={modalMode === 'view'} />
                                        <InputField label="ความจุกระบอกสูบ (CC)" value={formData.cylinder_capacityp} onChange={(v:any) => setFormData({...formData, cylinder_capacityp: v})} disabled={modalMode === 'view'} />
                                        <InputField label="แรงม้า (Horse Power)" value={formData.horse_power} onChange={(v:any) => setFormData({...formData, horse_power: v})} disabled={modalMode === 'view'} />
                                        <InputField label="น้ำหนัก (Weight)" value={formData.weight} onChange={(v:any) => setFormData({...formData, weight: v})} disabled={modalMode === 'view'} />
                                    </div>
                                </FormSection>

                                <FormSection title="หมวดหน่วยงานและค่าใช้จ่าย (Operations & Expenses)">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        <SelectField label="รหัสหน่วยงาน (Own Div Code)" value={formData.own_div_code} onChange={(v:any) => setFormData({...formData, own_div_code: v})} options={options?.orgs} valueKey="orgid" labelKey="orgname" disabled={modalMode === 'view'} />
                                        <InputField label="หมายเลขอ้างอิงรถ (Ref Car)" value={formData.ref_car} onChange={(v:any) => setFormData({...formData, ref_car: v})} disabled={modalMode === 'view'} />
                                        <InputField label="หมายเลข Fleetcard" value={formData.fleetcard_no} onChange={(v:any) => setFormData({...formData, fleetcard_no: v})} disabled={modalMode === 'view'} />
                                        
                                        <SelectField label="ชนิดน้ำมัน" value={formData.oil_type_id} onChange={(v:any) => setFormData({...formData, oil_type_id: v})} options={options?.oilTypes} valueKey="oil_type_id" labelKey="oil_type_name" disabled={modalMode === 'view'} />
                                        <InputField label="ค่าใช้จ่ายน้ำมัน" type="number" step="0.01" value={formData.oil_expense} onChange={(v:any) => setFormData({...formData, oil_expense: v})} disabled={modalMode === 'view'} />
                                        <InputField label="การคืนภาษี (Refund Vat)" type="number" value={formData.refund_vat} onChange={(v:any) => setFormData({...formData, refund_vat: v})} disabled={modalMode === 'view'} />
                                        
                                        <InputField label="Flag (สัญลักษณ์)" value={formData.flag} onChange={(v:any) => setFormData({...formData, flag: v})} disabled={modalMode === 'view'} />
                                    </div>
                                </FormSection>
                            </div>
                        </div>

                        {modalMode !== 'view' && (
                            <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3 z-10">
                                <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-md font-bold text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                                    ยกเลิก
                                </button>
                                <button type="button" onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-md font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-200 transition-all disabled:opacity-70">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลรถยนต์'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Components เสริมภายในไฟล์
function SelectFilter({ label, value, onChange, options, valKey, lblKey }: any) {
    return (
        <div className="space-y-1.5 focus-within:z-10">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</label>
            <select 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
            >
                <option value="">ทั้งหมด (All)</option>
                {options?.map((opt:any) => (
                    <option key={opt[valKey]} value={opt[valKey]}>
                        {opt[lblKey]}
                    </option>
                ))}
            </select>
        </div>
    );
}

function FormSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm col-span-1 lg:col-span-3 hover:shadow-md transition-shadow">
            <h3 className="text-sm font-semibold text-blue-900 mb-5 border-b border-gray-50 pb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                {title}
            </h3>
            {children}
        </div>
    );
}

function InputField({ label, type = "text", value, onChange, placeholder, disabled, required, step }: any) {
    return (
        <div className="space-y-1.5 group">
            <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <input 
                type={type} 
                step={step}
                value={value || ''} 
                onChange={(e) => onChange(e.target.value)} 
                placeholder={placeholder}
                disabled={disabled}
                className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none disabled:opacity-60 disabled:bg-gray-100 placeholder:font-medium placeholder:text-gray-400"
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options, valueKey, labelKey, disabled, required }: any) {
    return (
        <div className="space-y-1.5 group">
            <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <select 
                value={value || ''} 
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none disabled:opacity-60 disabled:bg-gray-100 cursor-pointer"
            >
                <option value="">-- เลือก --</option>
                {options?.map((opt:any) => (
                    <option key={opt[valueKey]} value={opt[valueKey]}>
                        {opt[labelKey]}
                    </option>
                ))}
            </select>
        </div>
    );
}
