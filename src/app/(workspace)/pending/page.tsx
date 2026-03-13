'use client';

import { useState, useEffect } from 'react';
import { getMyBookings } from '@/app/actions/bookingActions';
import {
    Calendar, MapPin, Search, Clock, ChevronRight,
    RefreshCw, CheckCircle2, XCircle, AlertCircle, Users, Loader2
} from 'lucide-react';

export default function PendingPage() {
    // 1. เตรียม State สำหรับรับข้อมูลจาก Database
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true); // จัดการสถานะโหลดข้อมูล
    const [error, setError] = useState<string | null>(null);

    // 2. State สำหรับการค้นหา และ Modal
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<any>(null);

    // 3. ฟังก์ชันดึงข้อมูลจาก API (Database)
    useEffect(() => {
        const fetchRequests = async () => {
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
                        time: b.journer_time || 'N/A',
                        objective: b.journey_causes || '-',
                        status: b.status_use_id ? String(b.status_use_id) : '1',
                        // เพิ่ม fields สำหรับนำไปแสดงใน Modal Detail
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
                    setError("ไม่สามารถโหลดข้อมูลคำขอได้ กรุณาลองใหม่อีกครั้ง");
                }

                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch requests", err);
                setError("ไม่สามารถโหลดข้อมูลคำขอได้ กรุณาลองใหม่อีกครั้ง");
                setIsLoading(false);
            }
        };

        fetchRequests();
    }, []); // <-- ลบ currentUser ออกจาก dependency array แล้ว

    // 4. ฟังก์ชันจัดการค้นหา (ทำงานจริง)
    const filteredRequests = requests.filter(req =>
        req.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.destination?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <RefreshCw className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">ติดตามสถานะคำขอ</h1>
                        <p className="text-gray-500 font-medium mt-1">ตรวจสอบความคืบหน้าของรายการจองรถของคุณ</p>
                    </div>
                </div>

                <div className="relative w-full md:w-auto">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาเลขที่คำขอ หรือ สถานที่..."
                        className="w-full md:w-80 pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="text-xl font-bold text-gray-900">รายการคำขอทั้งหมด</h2>
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest ml-2">
                            {filteredRequests.length}
                        </span>
                    </div>
                </div>

                {/* สถานะ Loading */}
                {isLoading ? (
                    <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100 shadow-sm flex flex-col items-center gap-4">
                        <Loader2 size={48} className="text-blue-500 animate-spin" />
                        <p className="font-bold text-lg text-gray-500">กำลังโหลดข้อมูล...</p>
                    </div>
                ) : error ? (
                    /* สถานะ Error */
                    <div className="bg-rose-50 p-20 rounded-[3rem] text-center border border-rose-100 shadow-sm flex flex-col items-center gap-4">
                        <AlertCircle size={48} className="text-rose-500" />
                        <p className="font-bold text-lg text-rose-600">{error}</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    /* สถานะไม่พบข้อมูล */
                    <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100 shadow-sm flex flex-col items-center gap-4">
                        <AlertCircle size={48} className="text-gray-200" />
                        <p className="font-black text-xl text-gray-400 uppercase tracking-widest">
                            {searchQuery ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่พบรายการคำขอ'}
                        </p>
                    </div>
                ) : (
                    /* แสดงข้อมูลจริง */
                    <div className="grid grid-cols-1 gap-4">
                        {filteredRequests.map((req) => {
                            const status = Number(req.status);
                            const statusName = getStatusName(status) || 'สถานะไม่ระบุ';
                            const statusColor = getStatusColor(status) || 'text-gray-600 bg-gray-50 border-gray-100';
                            const StatusIcon = Clock;

                            return (
                                <div
                                    key={req.id}
                                    onClick={() => setSelectedRequest(req)}
                                    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-center gap-6"
                                >
                                    {/* Request Info */}
                                    <div className="flex-1 min-w-[200px]">
                                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1 block">
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
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                            <MapPin className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-gray-800 line-clamp-1 flex items-center gap-2">
                                                <span>{req.origin}</span>
                                                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span className="text-blue-600">{req.destination}</span>
                                            </p>
                                            <p className="text-xs text-gray-400 font-medium line-clamp-1 uppercase tracking-tight">{req.objective}</p>
                                        </div>
                                    </div>

                                    {/* Date-Time */}
                                    <div className="flex-1 flex items-start gap-4 min-w-[200px]">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                <span className="text-base font-black text-gray-700">{req.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-400 font-bold">{req.time} น.</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Action */}
                                    <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 lg:w-auto mt-4 lg:mt-0">
                                        <div className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-[10px] sm:text-[11px] font-black uppercase tracking-tight shadow-sm ${statusColor} whitespace-normal text-center min-h-[32px] max-w-[200px] sm:max-w-none`}>
                                            <StatusIcon size={14} className="shrink-0" />
                                            <span className="leading-tight">{statusName}</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all shrink-0">
                                            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ส่วน Detail Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl w-full max-w-2xl relative overflow-hidden">
                        <button
                            onClick={() => setSelectedRequest(null)}
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>

                        <div className="mb-6 border-b border-gray-100 pb-6">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{selectedRequest.id}</span>
                            <h2 className="text-2xl font-black text-gray-900 mt-1">รายละเอียดคำขอจองรถ</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mt-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">ชื่อผู้ขอ</p>
                                <p className="text-lg font-bold text-gray-900">{selectedRequest.requester}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">สังกัด</p>
                                <p className="text-lg font-bold text-gray-900">{selectedRequest.department}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">เส้นทาง</p>
                                <p className="text-lg font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                                    <span className="bg-gray-100 px-3 py-1 rounded-xl text-sm">{selectedRequest.origin}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-sm">{selectedRequest.destination}</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">วันเดินทางไป</p>
                                <p className="text-lg font-bold text-gray-900">{selectedRequest.date} - {selectedRequest.time} น.</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">วันเดินทางกลับ</p>
                                <p className="text-lg font-bold text-gray-900">{selectedRequest.endDate} - {selectedRequest.endTime} น.</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">ประเภทรถ / ผู้โดยสาร</p>
                                <p className="text-lg font-bold text-gray-900">{selectedRequest.carType} <span className="text-sm font-medium text-gray-500">({selectedRequest.passengers} คน)</span></p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">ลักษณะการขับ</p>
                                <p className="text-lg font-bold text-gray-900">{selectedRequest.selfDrive}</p>
                            </div>
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl mt-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">วัตถุประสงค์ / หมายเหตุ</p>
                                <p className="text-base font-bold text-gray-800 mt-1 whitespace-pre-wrap">{selectedRequest.objective}</p>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end pt-6 border-t border-gray-100">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                            >
                                ปิดหน้าต่าง
                            </button>
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

export const getStatusName = (status: number | string) => {
    const strStatus = String(status).toUpperCase();

    switch (strStatus) {
        case '1':
        case 'PENDING':
            return 'รอการอนุมัติ';
        case '2':
        case 'APPROVED':
            return 'อนุมัติแล้ว';
        case '3':
        case 'REJECTED':
            return 'ไม่อนุมัติ';
        case '4':
        case 'COMPLETED':
            return 'เสร็จสิ้น';
        case '5':
        case 'CANCELED':
            return 'ยกเลิก';
        default:
            return 'สถานะไม่ระบุ';
    }
};

export const getStatusColor = (status: number | string) => {
    const strStatus = String(status).toUpperCase();

    switch (strStatus) {
        case '1':
        case 'PENDING':
            return 'text-amber-600 bg-amber-50 border-amber-200';
        case '2':
        case 'APPROVED':
            return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        case '3':
        case 'REJECTED':
            return 'text-rose-600 bg-rose-50 border-rose-200';
        case '4':
        case 'COMPLETED':
            return 'text-blue-600 bg-blue-50 border-blue-200';
        case '5':
        case 'CANCELED':
            return 'text-gray-600 bg-gray-100 border-gray-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-100';
    }
};