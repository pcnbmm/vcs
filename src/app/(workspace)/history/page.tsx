'use client';

import { useState, useEffect } from 'react';
import { getHistoryBookings } from '@/app/actions/bookingActions';
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

export default function HistoryPage() {
    // 1. State สำหรับดึงข้อมูลจาก API
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 2. State สำหรับการค้นหาและ Modal
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<any>(null);

    // 3. ดึงข้อมูลครั้งแรกจาก Database
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                const result = await getHistoryBookings();
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
                        status: b.status_use_id ? String(b.status_use_id) : '1',
                        statusName: b.vc_status_use_code?.status_use_name || 'รอดำเนินการ',
                        // Details for modal
                        carType: b.car_spec_id,
                        origin: b.start_place,
                        province: b.journey_province,
                        passengers: b.passenger_amount,
                        phone: b.user_mobile,
                        selfDrive: b.self_drive ? 'ใช่ (ขับเอง)' : 'ไม่ใช่ (ขอพนักงานขับ)',
                        endDate: b.return_date ? new Date(b.return_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
                        endTime: b.return_time || '-',
                    }));
                    setRequests(formattedList);
                } else {
                    setRequests([]);
                    setError("ไม่สามารถโหลดประวัติได้");
                }
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch history", err);
                setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, []);

    // 4. จัดการกรองข้อมูล
    const historyRequests = requests.filter(req => {
        // กรองสถานะที่ถือว่าเป็น "ประวัติ" (2=Approved, 3=Rejected, 5=Completed, 6=Cancelled)
        const isHistoryStatus = [2, 3, 5, 6].includes(Number(req.status));

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
            <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-[2rem] flex items-center justify-center shadow-2xl border border-slate-600 group-hover:scale-105 transition-transform">
                            <Archive className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">ประวัติคำขอใช้รถ</h1>
                            <p className="text-slate-400 font-medium mt-1">รายการคำขอที่ดำเนินการเสร็จสิ้นหรือยกเลิกแล้ว</p>
                        </div>
                    </div>

                    <div className="relative w-full md:w-auto">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ค้นหาตามเลขที่ หรือ สถานที่..."
                            className="w-full md:w-96 pl-14 pr-6 py-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={22} />
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="bg-white p-24 rounded-[3.5rem] text-center border border-gray-100 shadow-sm flex flex-col items-center gap-4">
                        <Loader2 size={56} className="text-slate-800 animate-spin" />
                        <p className="font-bold text-xl text-slate-500">กำลังโหลดประวัติ...</p>
                    </div>
                ) : error ? (
                    <div className="bg-rose-50 p-24 rounded-[3.5rem] text-center border border-rose-100 shadow-sm flex flex-col items-center gap-4">
                        <AlertCircle size={56} className="text-rose-500" />
                        <p className="font-bold text-xl text-rose-600">{error}</p>
                    </div>
                ) : historyRequests.length === 0 ? (
                    <div className="bg-white p-24 rounded-[3.5rem] text-center border border-gray-100 shadow-sm flex flex-col items-center gap-6">
                        <Archive size={64} className="text-gray-200" />
                        <p className="font-black text-2xl text-gray-400 uppercase tracking-widest italic">
                            {searchQuery ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีประวัติรายการ'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5">
                        {historyRequests.map((req) => {
                            const status = Number(req.status);
                            const statusColor = getStatusColor(status);
                            const StatusIcon = CheckCircle2;

                            return (
                                <div
                                    key={req.id}
                                    onClick={() => setSelectedRequest(req)}
                                    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-center gap-6"
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
                                                inline-flex items-center gap-2 px-6 py-2.5 rounded-full border text-[13px] font-bold shadow-sm transition-all
                                                ${statusColor}
                                            `}>
                                            <StatusIcon size={16} className="shrink-0" />
                                            {req.statusName}
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
                                    value={selectedRequest.statusName}
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
                                    <ReadOnlyField label="จำนวนผู้โดยสาร (Passengers)" value={`${selectedRequest.passengers} คน`} icon={Users} />
                                    <ReadOnlyField label="ลักษณะการขับขี่" value={selectedRequest.selfDrive} icon={Clock} />
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">วัตถุประสงค์ (Objective)</p>
                                    <p className="font-bold text-slate-800 leading-relaxed">{selectedRequest.objective}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// ⬇️ Helper Functions ⬇️
// ==========================================

const REQUEST_STATUS = {
    PENDING: 1,
    APPROVED: 2,
    REJECTED: 3,
    IN_USE: 4,
    COMPLETED: 5,
    CANCELLED: 6
};

const getStatusColor = (status: number | string) => {
    const numStatus = Number(status);
    switch (numStatus) {
        case REQUEST_STATUS.PENDING:
            return 'text-amber-600 bg-amber-50 border-amber-200';
        case REQUEST_STATUS.APPROVED:
            return 'text-emerald-700 bg-emerald-50 border-emerald-300 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.4)]';
        case REQUEST_STATUS.REJECTED:
            return 'text-rose-700 bg-rose-50 border-rose-200 shadow-[0_2px_10px_-3px_rgba(244,63,94,0.3)]';
        case REQUEST_STATUS.IN_USE:
            return 'text-blue-600 bg-blue-50 border-blue-200';
        case REQUEST_STATUS.COMPLETED:
            return 'text-indigo-600 bg-indigo-50 border-indigo-200';
        case REQUEST_STATUS.CANCELLED:
            return 'text-slate-500 bg-slate-50 border-slate-200 shadow-sm';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-100';
    }
};

// --- Internal helper components for this page ---
const DetailCard = ({ label, value, subValue, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-lg font-black text-gray-900 leading-tight mt-1">{value}</p>
            {subValue && <p className="text-xs font-bold text-gray-400 mt-0.5">{subValue}</p>}
        </div>
    </div>
);

const ReadOnlyField = ({ label, value, icon: Icon }: any) => (
    <div className="space-y-2">
        <div className="flex items-center gap-2">
            <Icon size={14} className="text-slate-400" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
        <p className="text-base font-bold text-slate-700 ml-5">{value || '-'}</p>
    </div>
);