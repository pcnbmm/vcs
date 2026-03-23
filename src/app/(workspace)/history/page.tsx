'use client';

import { useState, useEffect } from 'react';
import { getMyBookings } from '@/app/actions/bookingActions';
import {
    Calendar,
    MapPin,
    Search,
    Clock,
    ChevronRight,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Users,
    Archive,
    Loader2
} from 'lucide-react';

// ประกาศ Status ไว้ใช้ในหน้านี้ (หรือสามารถแยกไปไว้ในไฟล์ utils/constants.ts ได้)
const REQUEST_STATUS = {
    REJECTED: 3,
    IN_USE: 4,
    RETURN_APPROVED: 5, // Completed
};

export default function HistoryPage() {
    // 1. State สำหรับดึงข้อมูลจาก API
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 2. State สำหรับค้นหาและแสดง Modal
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<any>(null);

    // 3. ฟังก์ชันดึงข้อมูลจาก Database
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                const result = await getMyBookings();
                
                if (result.success && result.data) {
                    const formattedList = result.data.map((b: any) => ({
                        id: String(b.request_id),
                        requester: 'ผู้ใช้งานระบบ',
                        department: b.use_div_code || 'ฝ่ายบริหาร',
                        destination: b.journey_place,
                        date: b.journey_date ? new Date(b.journey_date).toLocaleDateString('th-TH', {
                            day: 'numeric', month: 'short', year: 'numeric'
                        }) : 'N/A',
                        time: b.journey_time || 'N/A',
                        objective: b.journey_causes || '-',
                        status: b.status_use_id ? Number(b.status_use_id) : 1,
                        origin: b.start_place,
                        passengers: b.passenger_amount,
                    }));
                    setRequests(formattedList);
                }
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch history", err);
                setError("ไม่สามารถโหลดประวัติคำขอได้ กรุณาลองใหม่อีกครั้ง");
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, []);

    // 4. จัดการกรองข้อมูล (แสดงเฉพาะประวัติที่จบแล้ว + ค้นหาจาก text)
    const historyRequests = requests.filter(req => {
        // กรองสถานะที่ถือว่าเป็น "ประวัติ"
        const isHistoryStatus = [
            REQUEST_STATUS.REJECTED,
            REQUEST_STATUS.RETURN_APPROVED
        ].includes(Number(req.status));

        // กรองตามคำค้นหา
        const matchesSearch = 
            req.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.requester?.toLowerCase().includes(searchQuery.toLowerCase());

        return isHistoryStatus && matchesSearch;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                        <Archive className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">ประวัติคำขอ (History)</h1>
                        <p className="text-gray-500 font-medium mt-1">รายการคำขอที่ดำเนินการเสร็จสิ้นแล้ว</p>
                    </div>
                </div>

                <div className="relative w-full md:w-auto">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาเลขที่, ชื่อ หรือสถานที่..."
                        className="w-full md:w-80 pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all font-medium"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-slate-800 rounded-full"></div>
                        <h2 className="text-xl font-bold text-gray-900">รายการย้อนหลังทั้งหมด</h2>
                        <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest ml-2">
                            {historyRequests.length}
                        </span>
                    </div>
                </div>

                {/* แสดงผลตาม State: Loading, Error, Empty, Data */}
                {isLoading ? (
                    <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100 shadow-sm flex flex-col items-center gap-4">
                        <Loader2 size={48} className="text-slate-800 animate-spin" />
                        <p className="font-bold text-lg text-gray-500">กำลังโหลดข้อมูลประวัติ...</p>
                    </div>
                ) : error ? (
                    <div className="bg-rose-50 p-20 rounded-[3rem] text-center border border-rose-100 shadow-sm flex flex-col items-center gap-4">
                        <AlertCircle size={48} className="text-rose-500" />
                        <p className="font-bold text-lg text-rose-600">{error}</p>
                    </div>
                ) : historyRequests.length === 0 ? (
                    <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100 shadow-sm flex flex-col items-center gap-4">
                        <Archive size={48} className="text-gray-200" />
                        <p className="font-black text-xl text-gray-400 uppercase tracking-widest">
                            {searchQuery ? 'ไม่พบประวัติที่ค้นหา' : 'ไม่พบประวัติคำขอ'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {historyRequests.map((req) => {
                            const statusName = getStatusName(req.status);
                            const statusColor = getStatusColor(req.status);
                            const StatusIcon = Number(req.status) === REQUEST_STATUS.RETURN_APPROVED ? CheckCircle2 : XCircle;

                            return (
                                <div
                                    key={req.id}
                                    onClick={() => setSelectedRequest(req)}
                                    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-center gap-6 opacity-80 hover:opacity-100 grayscale hover:grayscale-0"
                                >
                                    {/* Request Info */}
                                    <div className="flex-1 min-w-[200px]">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 block">
                                            {req.id}
                                        </span>
                                        <h3 className="text-lg font-black text-gray-900 leading-tight">
                                            {req.requester}
                                        </h3>
                                        <p className="text-sm text-gray-400 font-bold mt-0.5">
                                            {req.department}
                                        </p>
                                    </div>

                                    {/* Destination */}
                                    <div className="flex-1 flex items-start gap-3 min-w-[250px]">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 group-hover:bg-slate-100 group-hover:border-slate-200 transition-colors">
                                            <MapPin className="w-5 h-5 text-gray-400 group-hover:text-slate-600" />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-gray-800 line-clamp-1">{req.destination}</p>
                                            <p className="text-xs text-gray-400 font-medium line-clamp-1 uppercase tracking-tight">{req.objective}</p>
                                        </div>
                                    </div>

                                    {/* Date-Time */}
                                    <div className="flex-1 flex items-start gap-4 min-w-[200px]">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-500" />
                                                <span className="text-base font-black text-gray-700">{req.date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Action */}
                                    <div className="flex items-center justify-between lg:justify-end gap-6 shrink-0 lg:min-w-[200px]">
                                        <div className={`
                                                inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-black uppercase tracking-tighter shadow-sm
                                                ${statusColor}
                                            `}>
                                            <StatusIcon size={14} className="shrink-0" />
                                            {statusName}
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:bg-slate-800 group-hover:border-slate-800 group-hover:text-white transition-all">
                                            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center shadow-lg shadow-white/10">
                                    <Archive className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Historical Record</h2>
                                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{selectedRequest.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all group"
                            >
                                <XCircle size={24} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-10 overflow-y-auto space-y-10 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <DetailCard
                                    label="ผู้ขอใช้รถ"
                                    value={selectedRequest.requester}
                                    subValue={selectedRequest.department}
                                    icon={Users}
                                    color="text-slate-600 bg-slate-50"
                                />
                                <DetailCard
                                    label="เส้นทาง"
                                    value={`${selectedRequest.origin || 'หลักสี่'} → ${selectedRequest.destination}`}
                                    subValue={selectedRequest.province || 'กรุงเทพมหานคร'}
                                    icon={MapPin}
                                    color="text-slate-600 bg-slate-50"
                                />
                                <DetailCard
                                    label="สถานะสุดท้าย"
                                    value={getStatusName(selectedRequest.status)}
                                    subValue="Final Status"
                                    icon={CheckCircle2}
                                    color={getStatusColor(selectedRequest.status)}
                                />
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                    <div className="w-2 h-6 bg-slate-400 rounded-full"></div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">รายละเอียด (Details)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <ReadOnlyField label="จำนวนผู้เดินทาง" value={`${selectedRequest.passengers || 0} คน`} />
                                    <ReadOnlyField label="วันที่" value={selectedRequest.date} />
                                    <ReadOnlyField label="เวลา" value={selectedRequest.time} />
                                    <ReadOnlyField label="หมายเหตุ" value={selectedRequest.objective || '-'} />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-slate-50 p-8 flex justify-end shrink-0 border-t border-gray-100">
                            <button
                                onClick={() => setSelectedRequest(null)}
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
        <div className="p-6 rounded-[2rem] border border-gray-100 bg-gray-50/30">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon size={20} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-base font-black text-gray-900 leading-tight mb-0.5">{value}</p>
            <p className="text-xs text-gray-500 font-bold truncate">{subValue}</p>
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

// ==========================================
// ⬇️ Helper Functions ⬇️
// ==========================================

const getStatusName = (status: number | string) => {
    const numStatus = Number(status);
    switch (numStatus) {
        case REQUEST_STATUS.REJECTED:
            return 'ไม่อนุมัติ';
        case REQUEST_STATUS.RETURN_APPROVED:
            return 'เสร็จสิ้นสมบูรณ์';
        case REQUEST_STATUS.IN_USE:
            return 'กำลังใช้งาน';
        case 2:
            return 'อนุมัติแล้ว';
        default:
            return 'สถานะไม่ระบุ';
    }
};

const getStatusColor = (status: number | string) => {
    const numStatus = Number(status);
    switch (numStatus) {
        case REQUEST_STATUS.REJECTED:
            return 'text-rose-600 bg-rose-50 border-rose-200';
        case REQUEST_STATUS.RETURN_APPROVED:
            return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        case REQUEST_STATUS.IN_USE:
            return 'text-blue-600 bg-blue-50 border-blue-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-100';
    }
};