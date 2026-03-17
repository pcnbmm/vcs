'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Car,
    Activity,
    CreditCard,
    Settings,
    CalendarDays,
    ChevronRight,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Info,
    MoreHorizontal
} from 'lucide-react';

export default function RegistryPage() {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                setIsLoading(true);
                const res = await fetch('/api/vehicles');
                if (!res.ok) {
                    throw new Error('Failed to fetch vehicles data');
                }
                const data = await res.json();
                setVehicles(data);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch vehicles", err);
                setError("ไม่สามารถโหลดข้อมูลทะเบียนรถได้ กรุณาลองใหม่อีกครั้ง");
                setIsLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    // Filter Logic
    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch = 
            v.car_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.car_brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.car_series_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.car_status_name?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    // Reset page to 1 whenever search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedVehicles = filteredVehicles.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const skipPages = (count: number) => {
        let newPage = currentPage + count;
        if (newPage < 1) newPage = 1;
        if (newPage > totalPages) newPage = totalPages;
        setCurrentPage(newPage);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                        <Car className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">ทะเบียนรถ (Car Master)</h1>
                        <p className="text-gray-500 font-medium mt-1">ข้อมูลหลักและสถานะของรถยนต์ทั้งหมด</p>
                    </div>
                </div>

                <div className="relative w-full md:w-auto">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาทะเบียน, ยี่ห้อ หรือสถานะ..."
                        className="w-full md:w-80 pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all font-medium text-gray-900"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-slate-800 rounded-full"></div>
                        <h2 className="text-xl font-bold text-gray-900">รายการรถยนต์</h2>
                        <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest ml-2">
                            ทั้งหมด {filteredVehicles.length} คัน
                        </span>
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
                    <div className="space-y-4">
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
                                            <tr
                                                key={vehicle.car_id}
                                                onClick={() => setSelectedVehicle(vehicle)}
                                                className="group hover:bg-slate-50/50 cursor-pointer transition-colors bg-white"
                                            >
                                                <td className="py-4 px-5">
                                                    <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/50">
                                                        {vehicle.car_id}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-5">
                                                    <span className="text-sm font-black text-gray-900">{vehicle.car_number || '-'}</span>
                                                </td>
                                                <td className="py-4 px-5">
                                                    <span className="text-sm font-bold text-gray-600">
                                                        {vehicle.car_brand_name || 'ไม่มียี่ห้อ'} {vehicle.car_series_name || ''}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-5">
                                                    <div className="flex items-center gap-2">
                                                        <Settings size={14} className="text-gray-400" />
                                                        <span className="text-sm font-bold text-gray-800">{vehicle.color_name || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays size={14} className="text-gray-400" />
                                                        <span className="text-sm font-bold text-gray-800">{vehicle.regis_date || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5">
                                                    <div className={`
                                                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-tighter shadow-sm
                                                        ${statusColor}
                                                    `}>
                                                        <StatusIcon size={12} className="shrink-0" />
                                                        {vehicle.car_status_name || 'ไม่ระบุสถานะ'}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5 text-center">
                                                    <div className="mx-auto inline-flex w-8 h-8 rounded-xl bg-white border border-gray-200 items-center justify-center group-hover:bg-slate-800 group-hover:border-slate-800 group-hover:text-white transition-all shadow-sm">
                                                        <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-gray-50">
                                <div className="text-sm text-gray-500 font-bold">
                                    แสดง {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredVehicles.length)} จาก {filteredVehicles.length} รายการ
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* First Page */}
                                    <button
                                        onClick={() => goToPage(1)}
                                        disabled={currentPage === 1}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                                        title="หน้าแรก"
                                    >
                                        <ChevronsLeft size={18} />
                                    </button>

                                    {/* Skip -5 Pages */}
                                    <button
                                        onClick={() => skipPages(-5)}
                                        disabled={currentPage <= 5}
                                        className="h-10 px-3 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-gray-50 disabled:cursor-not-allowed transition-colors text-xs font-black tracking-wider"
                                        title="ย้อนกลับ 5 หน้า"
                                    >
                                        -5
                                    </button>

                                    {/* Previous Page */}
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                                        title="หน้าก่อนหน้า"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    
                                    {/* Current Page Info */}
                                    <div className="px-5 py-2.5 text-sm font-black bg-slate-800 text-white rounded-xl shadow-md min-w-[5rem] text-center tracking-widest">
                                        {currentPage} <span className="opacity-50">/</span> {totalPages}
                                    </div>

                                    {/* Next Page */}
                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                                        title="หน้าถัดไป"
                                    >
                                        <ChevronRight size={18} />
                                    </button>

                                    {/* Skip +5 Pages */}
                                    <button
                                        onClick={() => skipPages(5)}
                                        disabled={currentPage > totalPages - 5}
                                        className="h-10 px-3 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-gray-50 disabled:cursor-not-allowed transition-colors text-xs font-black tracking-wider"
                                        title="ข้ามไป 5 หน้า"
                                    >
                                        +5
                                    </button>

                                    {/* Last Page */}
                                    <button
                                        onClick={() => goToPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                                        title="หน้าสุดท้าย"
                                    >
                                        <ChevronsRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedVehicle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
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
                            <button
                                onClick={() => setSelectedVehicle(null)}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all group"
                            >
                                <XCircle size={24} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-10 overflow-y-auto space-y-10 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <DetailCard
                                    label="ยี่ห้อ / รุ่น"
                                    value={selectedVehicle.car_brand_name || '-'}
                                    subValue={selectedVehicle.car_series_name || '-'}
                                    icon={Car}
                                    color="text-slate-600 bg-slate-50"
                                />
                                <DetailCard
                                    label="สีรถ"
                                    value={selectedVehicle.color_name || '-'}
                                    subValue="Color"
                                    icon={Settings}
                                    color="text-slate-600 bg-slate-50"
                                />
                                <DetailCard
                                    label="เลขบัตร Fleetcard"
                                    value={selectedVehicle.fleetcard_no || '-'}
                                    subValue="Fleetcard No"
                                    icon={CreditCard}
                                    color="text-slate-600 bg-slate-50"
                                />
                                <DetailCard
                                    label="สถานะ"
                                    value={selectedVehicle.car_status_name || '-'}
                                    subValue="Current Status"
                                    icon={Activity}
                                    color={(selectedVehicle.car_status_name === 'ใช้งานได้' || selectedVehicle.car_status_name?.toLowerCase().includes('active') || selectedVehicle.car_status_id === 1) ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 bg-slate-50'}
                                />
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

                        {/* Modal Footer */}
                        <div className="bg-slate-50 p-8 flex justify-end shrink-0 border-t border-gray-100">
                            <button
                                onClick={() => setSelectedVehicle(null)}
                                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// ⬇️ UI Components ⬇️
// ==========================================

function DetailCard({ label, value, subValue, icon: Icon, color }: any) {
    return (
        <div className="p-6 rounded-[2rem] border border-gray-100 bg-gray-50/30 flex flex-col h-full">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon size={20} />
            </div>
            <div className="mt-auto">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-base font-black text-gray-900 leading-tight mb-0.5 max-w-full break-words">{value}</p>
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