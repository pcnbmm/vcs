'use client';

import React, { useState, useEffect } from 'react';
import { mockDrivers } from '@/mock/data/drivers';
import { Car, User, CheckCircle, Clock, Wrench, Search, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface VcCar {
  car_id: number;
  car_number: string | null;
  car_brand_id: number | null;
  car_spec_id: number | null;
  car_type_id: number | null;
  car_status_id: number | null;
  machine_no: string | null;
  body_no: string | null;
  fleetcard_no: string | null;
  car_brand_name?: string | null;
  car_series_name?: string | null;
  color_name?: string | null;
  car_status_name?: string | null;
}

export default function RegistryPage() {
    const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Local state for CRUD
    const [vehicles, setVehicles] = useState<VcCar[]>([]);
    const [drivers, setDrivers] = useState<any[]>(mockDrivers);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await fetch('/api/vehicles');
                if (response.ok) {
                    const data = await response.json();
                    setVehicles(data);
                }
            } catch (error) {
                console.error("Error loading vehicles:", error);
            } finally {
                setIsLoadingVehicles(false);
            }
        };

        fetchVehicles();
    }, []);

    // Modal state
    const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
    const [editingVehicle, setEditingVehicle] = useState<Partial<VcCar> | null>(null);
    const [editingDriver, setEditingDriver] = useState<any | null>(null);

    // -- Filtering --
    const filteredVehicles = vehicles.filter(v => {
        const search = searchTerm.toLowerCase();
        const plate = v.car_number?.toLowerCase() || '';
        const body = v.body_no?.toLowerCase() || '';
        const machine = v.machine_no?.toLowerCase() || '';

        const matchesSearch = plate.includes(search) || body.includes(search) || machine.includes(search);
        
        // Let's assume car_status_id: 1=AVAILABLE, 2=BUSY, 3=MAINTENANCE just for UI filtering if needed
        const statusMap: Record<number, string> = { 1: 'AVAILABLE', 2: 'BUSY', 3: 'MAINTENANCE' };
        const vStatusTag = v.car_status_id ? (statusMap[v.car_status_id] || 'OTHER') : 'UNKNOWN';
        
        const matchesStatus = statusFilter === 'ALL' || vStatusTag === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filteredDrivers = drivers.filter(d => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = d.name.toLowerCase().includes(search) || d.licenseNumber.toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Pagination logic
    const activeDataLength = activeTab === 'vehicles' ? filteredVehicles.length : filteredDrivers.length;
    const totalPages = Math.ceil(activeDataLength / itemsPerPage) || 1;
    
    // Ensure current page is within bounds
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, activeTab]);

    const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // -- Helpers --
    const getStatusBadge = (statusId: number | null, statusName?: string | null) => {
        switch (statusId) {
            case 1:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={14}/> {statusName || 'พร้อมใช้งาน'} (1)</span>;
            case 2:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock size={14}/> {statusName || 'ใช้งานอยู่'} (2)</span>;
            case 3:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><Wrench size={14}/> {statusName || 'ซ่อมบำรุง'} (3)</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{statusName ? `${statusName} (${statusId})` : `รหัสสถานะ: ${statusId ?? '-'}`}</span>;
        }
    };

    const getDriverStatusBadge = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={14}/> ว่าง</span>;
            case 'BUSY':
            case 'IN_USE':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock size={14}/> ใช้งานอยู่</span>;
            case 'ON_LEAVE':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={14}/> ลางาน</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
        }
    }

    // -- CRUD Handlers --
    const openCreateModal = () => {
        if (activeTab === 'vehicles') {
            setEditingVehicle({ 
                car_id: Date.now(), 
                car_number: '', 
                car_brand_id: null, 
                car_spec_id: null, 
                car_type_id: null,
                body_no: '',
                machine_no: '',
                fleetcard_no: null,
                car_status_id: 1 
            });
        } else {
            setEditingDriver({ id: `d${Date.now()}`, name: '', licenseNumber: '', phone: '', status: 'AVAILABLE' });
        }
        setModalMode('create');
    };

    const openEditModal = (item: any) => {
        if (activeTab === 'vehicles') {
            setEditingVehicle(item as VcCar);
        } else {
            setEditingDriver(item);
        }
        setModalMode('edit');
    };

    const handleDelete = (id: string | number) => {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) return;
        if (activeTab === 'vehicles') {
            setVehicles(prev => prev.filter(v => v.car_id !== id));
        } else {
            setDrivers(prev => prev.filter(d => d.id !== id));
        }
    };

    const handleSave = () => {
        if (activeTab === 'vehicles' && editingVehicle) {
            if (modalMode === 'create') {
                setVehicles(prev => [editingVehicle as VcCar, ...prev]);
            } else {
                setVehicles(prev => prev.map(v => v.car_id === editingVehicle.car_id ? editingVehicle as VcCar : v));
            }
        } else if (activeTab === 'drivers' && editingDriver) {
            if (modalMode === 'create') {
                setDrivers(prev => [editingDriver, ...prev]);
            } else {
                setDrivers(prev => prev.map(d => d.id === editingDriver.id ? editingDriver : d));
            }
        }
        closeModal();
    };

    const closeModal = () => {
        setModalMode(null);
        setEditingVehicle(null);
        setEditingDriver(null);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">จัดการข้อมูลหลัก</h1>
                    <p className="text-gray-500 mt-1">อ้างอิงจากฐานข้อมูลจริง (vc_car_master) และคนขับ</p>
                </div>
                <button 
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-blue-600/20 transition-all"
                >
                    <Plus size={18} />
                    เพิ่ม{activeTab === 'vehicles' ? 'ยานพาหนะ' : 'คนขับรถ'}
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                    <button 
                        onClick={() => {
                            setActiveTab('vehicles');
                            setStatusFilter('ALL');
                        }}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'vehicles' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <Car size={18} /> ยานพาหนะ
                    </button>
                    <button 
                        onClick={() => {
                            setActiveTab('drivers');
                            setStatusFilter('ALL');
                        }}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'drivers' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <User size={18} /> คนขับรถ
                    </button>
                </div>
                
                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="พิมพ์เพื่อค้นหา..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                </div>
            </div>

            {/* List View Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50/80 text-gray-500 uppercase font-medium text-xs whitespace-nowrap">
                            {activeTab === 'vehicles' ? (
                                <tr>
                                    <th className="px-6 py-4">ID / ทะเบียนรถ</th>
                                    <th className="px-6 py-4">ยี่ห้อและรุ่น</th>
                                    <th className="px-6 py-4">ตัวถัง / รหัส Spec-Type</th>
                                    <th className="px-6 py-4">ฟลีทการ์ด</th>
                                    <th className="px-6 py-4">สถานะ</th>
                                    <th className="px-6 py-4 text-right">จัดการ</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="px-6 py-4">ชื่อ-นามสกุล</th>
                                    <th className="px-6 py-4">ใบอนุญาตขับขี่</th>
                                    <th className="px-6 py-4">เบอร์โทรศัพท์</th>
                                    <th className="px-6 py-4">สถานะ</th>
                                    <th className="px-6 py-4 text-right">จัดการ</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {activeTab === 'vehicles' && (
                                isLoadingVehicles ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                                                <p>กำลังโหลดข้อมูลจาก DB...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedVehicles.map((vehicle, idx) => (
                                    <tr key={`${vehicle.car_id}-${vehicle.car_number}-${idx}`} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 text-base">{vehicle.car_number || '-'}</div>
                                            <div className="text-xs text-gray-400">Car ID: {vehicle.car_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                {vehicle.car_brand_name || 'ไม่ระบุยี่ห้อ'} 
                                                {vehicle.color_name ? ` (สี${vehicle.color_name})` : ''}
                                            </div>
                                            <div className="text-sm text-gray-500">{vehicle.car_series_name || 'ไม่ระบุรุ่น'}</div>
                                            <div className="text-xs text-blue-500/70 mt-1">Brand ID: {vehicle.car_brand_id ?? '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-800 mb-1"><span className="text-gray-400 text-xs mr-1">ตัวถัง:</span>{vehicle.body_no || '-'}</div>
                                            <div className="flex gap-2">
                                                <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-medium" title="Spec ID">S: {vehicle.car_spec_id ?? '-'}</span>
                                                <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-medium" title="Type ID">T: {vehicle.car_type_id ?? '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                            {vehicle.fleetcard_no ? (
                                                <span className="bg-gray-50 px-2 py-1 rounded-md font-mono text-xs border border-gray-100">
                                                    {vehicle.fleetcard_no}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(vehicle.car_status_id, vehicle.car_status_name)}</td>
                                        <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEditModal(vehicle)} className="p-2 text-gray-400 hover:text-blue-600 bg-white shadow-sm border border-gray-100 hover:border-blue-200 rounded-lg transition-all">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(vehicle.car_id)} className="p-2 text-gray-400 hover:text-red-600 bg-white shadow-sm border border-gray-100 hover:border-red-200 rounded-lg transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}

                            {activeTab === 'drivers' && paginatedDrivers.map(driver => (
                                <tr key={driver.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                                            <User size={16} />
                                        </div>
                                        {driver.name}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{driver.licenseNumber}</td>
                                    <td className="px-6 py-4">{driver.phone}</td>
                                    <td className="px-6 py-4">{getDriverStatusBadge(driver.status)}</td>
                                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEditModal(driver)} className="p-2 text-gray-400 hover:text-blue-600 bg-white shadow-sm border border-gray-100 hover:border-blue-200 rounded-lg transition-all">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(driver.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white shadow-sm border border-gray-100 hover:border-red-200 rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {((activeTab === 'vehicles' && !isLoadingVehicles && filteredVehicles.length === 0) || (activeTab === 'drivers' && filteredDrivers.length === 0)) && (
                        <div className="text-center py-24 flex flex-col items-center justify-center bg-gray-50/30">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                <Search size={24} />
                            </div>
                            <h3 className="text-gray-900 font-medium text-lg">ไม่พบข้อมูล</h3>
                            <p className="text-gray-500 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {activeDataLength > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                        <div className="text-sm text-gray-500">
                            แสดงข้อมูล <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> ถึง <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, activeDataLength)}</span> จากทั้งหมด <span className="font-medium text-gray-900">{activeDataLength}</span> รายการ
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <button 
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="p-1.5 sm:p-2 border border-gray-200 bg-white rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:bg-transparent disabled:cursor-not-allowed transition-all shadow-sm"
                                title="หน้าแรก"
                            >
                                <ChevronsLeft size={16} />
                            </button>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 5))}
                                disabled={currentPage <= 1}
                                className="border border-gray-200 bg-white rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:bg-transparent disabled:cursor-not-allowed transition-all shadow-sm text-xs font-bold w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hidden sm:flex"
                                title="ย้อนกลับ 5 หน้า"
                            >
                                -5
                            </button>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 sm:p-2 border border-gray-200 bg-white rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:bg-transparent disabled:cursor-not-allowed transition-all shadow-sm"
                                title="ก่อนหน้า"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            
                            <div className="flex items-center gap-1 mx-1">
                                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                                    let pageNum = currentPage;
                                    if (totalPages <= 5) pageNum = idx + 1;
                                    else if (currentPage <= 3) pageNum = idx + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + idx;
                                    else pageNum = currentPage - 2 + idx;

                                    return (
                                        <button 
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' : 'text-gray-600 hover:bg-white border border-transparent hover:border-gray-200'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 sm:p-2 border border-gray-200 bg-white rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:bg-transparent disabled:cursor-not-allowed transition-all shadow-sm"
                                title="ถัดไป"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 5))}
                                disabled={currentPage >= totalPages}
                                className="border border-gray-200 bg-white rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:bg-transparent disabled:cursor-not-allowed transition-all shadow-sm text-xs font-bold w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hidden sm:flex"
                                title="ข้ามไป 5 หน้า"
                            >
                                +5
                            </button>
                            <button 
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="p-1.5 sm:p-2 border border-gray-200 bg-white rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:bg-transparent disabled:cursor-not-allowed transition-all shadow-sm"
                                title="หน้าสุดท้าย"
                            >
                                <ChevronsRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Modal Overlay */}
            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                    {modalMode === 'create' ? <Plus size={18}/> : <Edit2 size={18}/>}
                                </div>
                                {modalMode === 'create' ? 'เพิ่ม' : 'แก้ไข'}{activeTab === 'vehicles' ? 'ยานพาหนะ' : 'คนขับรถ'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 hover:bg-white p-2 rounded-xl transition-all shadow-sm">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            {activeTab === 'vehicles' && editingVehicle && (
                                <>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">ทะเบียนรถ</label>
                                            <input type="text" placeholder="ระบุทะเบียนรถ" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none" value={editingVehicle.car_number || ''} onChange={e => setEditingVehicle({...editingVehicle, car_number: e.target.value})} />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">สถานะ</label>
                                            <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none appearance-none" value={editingVehicle.car_status_id || ''} onChange={e => setEditingVehicle({...editingVehicle, car_status_id: parseInt(e.target.value) || null})}>
                                                <option value="1">1 - พร้อมใช้งาน</option>
                                                <option value="2">2 - ใช้งานอยู่</option>
                                                <option value="3">3 - ซ่อมบำรุง</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">เลขตัวถัง</label>
                                            <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none" value={editingVehicle.body_no || ''} onChange={e => setEditingVehicle({...editingVehicle, body_no: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">เลขเครื่องยนต์</label>
                                            <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none" value={editingVehicle.machine_no || ''} onChange={e => setEditingVehicle({...editingVehicle, machine_no: e.target.value})} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Brand ID</label>
                                            <input type="number" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm" value={editingVehicle.car_brand_id || ''} onChange={e => setEditingVehicle({...editingVehicle, car_brand_id: parseInt(e.target.value) || null})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Spec ID</label>
                                            <input type="number" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm" value={editingVehicle.car_spec_id || ''} onChange={e => setEditingVehicle({...editingVehicle, car_spec_id: parseInt(e.target.value) || null})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type ID</label>
                                            <input type="number" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm" value={editingVehicle.car_type_id || ''} onChange={e => setEditingVehicle({...editingVehicle, car_type_id: parseInt(e.target.value) || null})} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Fleetcard No.</label>
                                        <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none" value={editingVehicle.fleetcard_no || ''} onChange={e => setEditingVehicle({...editingVehicle, fleetcard_no: e.target.value})} />
                                    </div>
                                </>
                            )}

                            {activeTab === 'drivers' && editingDriver && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ-นามสกุล</label>
                                        <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none" value={editingDriver.name || ''} onChange={e => setEditingDriver({...editingDriver, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ใบอนุญาตขับขี่</label>
                                        <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none" value={editingDriver.licenseNumber || ''} onChange={e => setEditingDriver({...editingDriver, licenseNumber: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์</label>
                                        <input type="tel" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none" value={editingDriver.phone || ''} onChange={e => setEditingDriver({...editingDriver, phone: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">สถานะ</label>
                                        <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none appearance-none" value={editingDriver.status || 'AVAILABLE'} onChange={e => setEditingDriver({...editingDriver, status: e.target.value})}>
                                            <option value="AVAILABLE">ว่าง (AVAILABLE)</option>
                                            <option value="BUSY">กำลังปฏิบัติงาน (BUSY)</option>
                                            <option value="ON_LEAVE">ลางาน (ON_LEAVE)</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
                            <button onClick={closeModal} className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-all">
                                ยกเลิก
                            </button>
                            <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2">
                                บันทึกข้อมูล
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}