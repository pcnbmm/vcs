'use client';

import React, { useState } from 'react';
import { mockVehicles } from '@/mock/data/vehicles';
import { mockDrivers } from '@/mock/data/drivers';
import { Car, User, CheckCircle, Clock, Wrench, Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Vehicle, Driver } from '@/types';

type TabType = 'vehicles' | 'drivers';
type ModalMode = 'create' | 'edit' | null;

export default function RegistryPage() {
    const [activeTab, setActiveTab] = useState<TabType>('vehicles');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Local state for CRUD
    const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
    const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);

    // Modal state
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> | null>(null);
    const [editingDriver, setEditingDriver] = useState<Partial<Driver> | null>(null);

    // -- Filtering --
    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch = v.plate.includes(searchTerm) || v.brand.toLowerCase().includes(searchTerm.toLowerCase()) || v.model.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || v.type === categoryFilter;
        const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const filteredDrivers = drivers.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || d.status === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // -- Helpers --
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={14}/> ว่าง</span>;
            case 'BUSY':
            case 'IN_USE':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock size={14}/> ใช้งานอยู่</span>;
            case 'MAINTENANCE':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><Wrench size={14}/> ซ่อมบำรุง</span>;
            case 'ON_LEAVE':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={14}/> ลางาน</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    // -- CRUD Handlers --
    const openCreateModal = () => {
        if (activeTab === 'vehicles') {
            setEditingVehicle({ id: `v${Date.now()}`, plate: '', brand: '', model: '', type: 'Sedan', capacity: 4, status: 'AVAILABLE' });
        } else {
            setEditingDriver({ id: `d${Date.now()}`, name: '', licenseNumber: '', phone: '', status: 'AVAILABLE' });
        }
        setModalMode('create');
    };

    const openEditModal = (item: Vehicle | Driver) => {
        if (activeTab === 'vehicles') {
            setEditingVehicle(item as Vehicle);
        } else {
            setEditingDriver(item as Driver);
        }
        setModalMode('edit');
    };

    const handleDelete = (id: string) => {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) return;
        if (activeTab === 'vehicles') {
            setVehicles(prev => prev.filter(v => v.id !== id));
        } else {
            setDrivers(prev => prev.filter(d => d.id !== id));
        }
    };

    const handleSave = () => {
        if (activeTab === 'vehicles' && editingVehicle) {
            if (modalMode === 'create') {
                setVehicles(prev => [...prev, editingVehicle as Vehicle]);
            } else {
                setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? editingVehicle as Vehicle : v));
            }
        } else if (activeTab === 'drivers' && editingDriver) {
            if (modalMode === 'create') {
                setDrivers(prev => [...prev, editingDriver as Driver]);
            } else {
                setDrivers(prev => prev.map(d => d.id === editingDriver.id ? editingDriver as Driver : d));
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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">ทะเบียนยานพาหนะและคนขับ</h1>
                    <p className="text-gray-500 mt-1">จัดการข้อมูลรถและพนักงานขับรถส่วนกลาง</p>
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
                            setCategoryFilter('ALL');
                            setStatusFilter('ALL');
                        }}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'vehicles' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <Car size={18} /> ยานพาหนะ
                    </button>
                    <button 
                        onClick={() => {
                            setActiveTab('drivers');
                            setCategoryFilter('ALL');
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
                        placeholder="ค้นหาข้อมูล..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                {activeTab === 'vehicles' ? (
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">ประเภทรถ:</span>
                            <div className="relative">
                                <select 
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium shadow-sm cursor-pointer"
                                >
                                    <option value="ALL">ทั้งหมด</option>
                                    <option value="Sedan">รถเก๋ง (Sedan)</option>
                                    <option value="Van">รถตู้ (Van)</option>
                                    <option value="Racing">รถแข่ง (Racing)</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">สถานะ:</span>
                            <div className="relative">
                                <select 
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium shadow-sm cursor-pointer"
                                >
                                    <option value="ALL">ทั้งหมด</option>
                                    <option value="AVAILABLE">ว่าง</option>
                                    <option value="BUSY">ใช้งานอยู่</option>
                                    <option value="MAINTENANCE">ซ่อมบำรุง</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">แสดงผล:</span>
                        <div className="relative">
                            <select 
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium shadow-sm cursor-pointer"
                            >
                                <option value="ALL">ทั้งหมด</option>
                                <option value="AVAILABLE">ว่าง</option>
                                <option value="BUSY">ใช้งานอยู่</option>
                                <option value="ON_LEAVE">ลางาน</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* List View Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50/50 text-gray-500 uppercase font-medium">
                            {activeTab === 'vehicles' ? (
                                <tr>
                                    <th className="px-6 py-4">ทะเบียนรถ</th>
                                    <th className="px-6 py-4">ยี่ห้อ/รุ่น</th>
                                    <th className="px-6 py-4">ประเภท</th>
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
                            {activeTab === 'vehicles' && filteredVehicles.map(vehicle => (
                                <tr key={vehicle.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-gray-900">{vehicle.plate}</td>
                                    <td className="px-6 py-4">{vehicle.brand} {vehicle.model}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-100 px-2.5 py-1 rounded-md text-xs">{vehicle.type} ({vehicle.capacity} ที่นั่ง)</span>
                                    </td>
                                    <td className="px-6 py-4">{getStatusBadge(vehicle.status)}</td>
                                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEditModal(vehicle)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-white shadow-sm border border-gray-100 rounded-lg">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(vehicle.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-white shadow-sm border border-gray-100 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {activeTab === 'drivers' && filteredDrivers.map(driver => (
                                <tr key={driver.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                                            <User size={16} />
                                        </div>
                                        {driver.name}
                                    </td>
                                    <td className="px-6 py-4">{driver.licenseNumber}</td>
                                    <td className="px-6 py-4">{driver.phone}</td>
                                    <td className="px-6 py-4">{getStatusBadge(driver.status)}</td>
                                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEditModal(driver)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-white shadow-sm border border-gray-100 rounded-lg">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(driver.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-white shadow-sm border border-gray-100 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {((activeTab === 'vehicles' && filteredVehicles.length === 0) || (activeTab === 'drivers' && filteredDrivers.length === 0)) && (
                        <div className="text-center py-20">
                            <p className="text-gray-500">ไม่พบข้อมูลที่ค้นหา</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Modal Overlay */}
            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm z-[100]">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100">
                            <h2 className="text-xl font-bold">
                                {modalMode === 'create' ? 'เพิ่ม' : 'แก้ไข'}{activeTab === 'vehicles' ? 'ยานพาหนะ' : 'คนขับรถ'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-5 space-y-4">
                            {activeTab === 'vehicles' && editingVehicle && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ทะเบียนรถ</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={editingVehicle.plate || ''} onChange={e => setEditingVehicle({...editingVehicle, plate: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อ</label>
                                            <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={editingVehicle.brand || ''} onChange={e => setEditingVehicle({...editingVehicle, brand: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">รุ่น</label>
                                            <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={editingVehicle.model || ''} onChange={e => setEditingVehicle({...editingVehicle, model: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
                                            <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={editingVehicle.type || ''} onChange={e => setEditingVehicle({...editingVehicle, type: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่นั่ง</label>
                                            <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={editingVehicle.capacity || 0} onChange={e => setEditingVehicle({...editingVehicle, capacity: parseInt(e.target.value)})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={editingVehicle.status || 'AVAILABLE'} onChange={e => setEditingVehicle({...editingVehicle, status: e.target.value as any})}>
                                            <option value="AVAILABLE">ว่าง (AVAILABLE)</option>
                                            <option value="BUSY">ใช้งานอยู่ (BUSY)</option>
                                            <option value="MAINTENANCE">ซ่อมบำรุง (MAINTENANCE)</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {activeTab === 'drivers' && editingDriver && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={editingDriver.name || ''} onChange={e => setEditingDriver({...editingDriver, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ใบอนุญาตขับขี่</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={editingDriver.licenseNumber || ''} onChange={e => setEditingDriver({...editingDriver, licenseNumber: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                                        <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={editingDriver.phone || ''} onChange={e => setEditingDriver({...editingDriver, phone: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={editingDriver.status || 'AVAILABLE'} onChange={e => setEditingDriver({...editingDriver, status: e.target.value as any})}>
                                            <option value="AVAILABLE">ว่าง (AVAILABLE)</option>
                                            <option value="BUSY">กำลังปฏิบัติงาน (BUSY)</option>
                                            <option value="ON_LEAVE">ลางาน (ON_LEAVE)</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button onClick={closeModal} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">
                                ยกเลิก
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                                บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}