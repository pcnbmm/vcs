'use client';

import { useState, useEffect } from 'react';
import {
    departments,
    vehicleTypes,
    provinces
} from '@/mock/data/vehicles'; 
import {
    FileText,
    Car,
    MapPin,
    Calendar,
    Clock,
    Users,
    User,
    Phone,
    MessageSquare,
    Search,
    ChevronDown,
    Plus,
    ArrowRight,
    X,
    Save,
    Eye,
    CheckCircle2,
    Map as MapIcon,
    Navigation as NavIcon,
    Loader2
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import LongdoMapBox from '@/components/ui/LongdoMapBox';

export default function VehicleRequestPage() {
    const router = useRouter();
    
    // --- ปรับแก้: ใช้ State จำลองเก็บข้อมูลแทน RoleContext ---
    const [carRequests, setCarRequests] = useState<any[]>([]); 
    // ----------------------------------------------------

    const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper to get today's date in YYYY-MM-DD format
    const getTodayDate = () => new Date().toISOString().split('T')[0];
    const getCurrentTime = () => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    };

    // Form States
    const [formData, setFormData] = useState({
        ownerDept: 'ฝ่ายบริหาร',
        vehicleType: 'รถเก๋ง 1500 cc',
        origin: 'หลักสี่',
        province: 'กรุงเทพมหานคร',
        destination: '',
        lat: 0,
        lon: 0,
        startDate: getTodayDate(),
        startTime: getCurrentTime(),
        endDate: getTodayDate(),
        endTime: '',
        objective: '',
        passengers: 1,
        phone: '',
        selfDrive: false
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.destination || !formData.startDate || !formData.startTime || !formData.objective) {
            alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (จุดหมาย, วันที่/เวลาเริ่ม, วัตถุประสงค์)');
            return;
        }

        setIsSubmitting(true);

        try {
            const dateObj = new Date(formData.startDate);
            const formattedDate = dateObj.toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            const payload: any = {
                // --- ปรับแก้: ใส่ชื่อจำลองไปก่อน ---
                requester: 'ผู้ใช้งานทดสอบ', 
                // -----------------------------
                department: formData.ownerDept,
                destination: formData.destination,
                lat: formData.lat,
                lon: formData.lon,
                date: formattedDate,
                time: `${formData.startTime}${formData.endTime ? ' - ' + formData.endTime : ''}`,
                endDate: formData.endDate,
                endTime: formData.endTime,
                origin: formData.origin,
                province: formData.province,
                passengers: formData.passengers,
                phone: formData.phone,
                status: 'Pending',
                type: formData.vehicleType,
                objective: formData.objective,
                // --- ปรับแก้: ใส่ ID จำลองไปก่อน ---
                userId: 'user-temp-01', 
                // -----------------------------
                requestDate: new Date().toLocaleDateString('th-TH'),
                selfDrive: formData.selfDrive
            };

            // จำลองการโหลด 1 วินาที
            await new Promise(resolve => setTimeout(resolve, 1000));

            // อัปเดต State (ใช้ State จำลองในหน้านี้)
            const newRequest = { ...payload, id: `REQ-${Math.floor(1000 + Math.random() * 9000)}` };
            setCarRequests((prev: any) => [newRequest, ...prev]);

            alert('บันทึกคำขอใช้รถเรียบร้อยแล้ว!');
            resetForm();
            setActiveTab('list');

        } catch (error) {
            console.error("Error saving booking:", error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            ownerDept: 'ฝ่ายบริหาร',
            vehicleType: 'รถเก๋ง 1500 cc',
            origin: 'หลักสี่',
            province: 'กรุงเทพมหานคร',
            destination: '',
            lat: 0,
            lon: 0,
            startDate: getTodayDate(),
            startTime: getCurrentTime(),
            endDate: getTodayDate(),
            endTime: '',
            objective: '',
            passengers: 1,
            phone: '',
            selfDrive: false
        });
    }

    // Helper: Lock province based on origin
    useEffect(() => {
        if (formData.origin === 'บางรัก' || formData.origin === 'หลักสี่') {
            handleInputChange('province', 'กรุงเทพมหานคร');
        } else if (formData.origin === 'แจ้งวัฒนะ') {
            handleInputChange('province', 'นนทบุรี');
        }
    }, [formData.origin]);

    // --- ปรับแก้: ไม่ต้อง Filter หา user ปัจจุบันแล้ว โชว์ทั้งหมดที่พึ่งกดบันทึกไปเลย ---
    const myRequests = carRequests;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-black tracking-tight">ขอใช้งานยานพาหนะ</h1>
                        <p className="text-gray-700 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            ระบบจัดการคำขอใช้รถยนต์ส่วนกลาง
                        </p>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('form')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'form'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        สร้างคำขอใหม่
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'list'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        ประวัติคำขอ ({myRequests.length})
                    </button>
                </div>
            </div>

            {activeTab === 'form' ? (
                <div className="grid grid-cols-1 gap-8">
                    {/* Main Form */}
                    <div className="w-full space-y-8">
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                                <Car size={200} />
                            </div>

                            <div className="relative space-y-10">
                                <div className="flex items-center gap-3 border-b border-gray-200 pb-6">
                                    <div className="w-2 h-8 bg-black rounded-full shadow-sm"></div>
                                    <h2 className="text-2xl font-black text-black uppercase tracking-tight">รายละเอียดแผนการเดินทาง</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                                    {/* Row 1 */}
                                    <FormField label="สังกัดเจ้าของรถ" icon={Users} required>
                                        <select
                                            value={formData.ownerDept}
                                            onChange={(e) => handleInputChange('ownerDept', e.target.value)}
                                            className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none font-bold text-black shadow-sm">
                                            {departments.map((d: string) => <option key={d}>{d}</option>)}
                                        </select>
                                    </FormField>

                                    <FormField label="ประเภทรถที่ต้องการ" icon={Car} required>
                                        <select
                                            value={formData.vehicleType}
                                            onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                                            className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none font-bold text-black shadow-sm">
                                            {vehicleTypes.map((v: string) => <option key={v}>{v}</option>)}
                                        </select>
                                    </FormField>

                                    {/* Row 2 */}
                                    <FormField label="สถานที่ (ต้นทาง)" icon={NavIcon} required>
                                        <select
                                            value={formData.origin}
                                            onChange={(e) => handleInputChange('origin', e.target.value)}
                                            className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none font-bold text-black shadow-sm">
                                            <option value="หลักสี่">หลักสี่</option>
                                            <option value="แจ้งวัฒนะ">แจ้งวัฒนะ</option>
                                            <option value="บางรัก">บางรัก</option>
                                        </select>
                                    </FormField>

                                    <FormField label="จังหวัด" icon={MapIcon} required>
                                        <select
                                            value={formData.province}
                                            onChange={(e) => handleInputChange('province', e.target.value)}
                                            disabled={['บางรัก', 'แจ้งวัฒนะ', 'หลักสี่'].includes(formData.origin)}
                                            className={`w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none font-bold text-black shadow-sm ${['บางรัก', 'แจ้งวัฒนะ', 'หลักสี่'].includes(formData.origin) ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''}`}>
                                            {provinces.map((p: string) => <option key={p} className="text-black">{p}</option>)}
                                        </select>
                                    </FormField>

                                    {/* Row 3 - Destination & Map (Full Width) */}
                                    <div className="md:col-span-2 space-y-4">
                                        <FormField label="สถานที่ (ปลายทาง)" icon={MapPin} required>
                                            <LongdoMapBox
                                                onLocationSelect={(loc: any) => {
                                                    handleInputChange('destination', loc.name);
                                                    handleInputChange('lat', loc.lat);
                                                    handleInputChange('lon', loc.lon);
                                                }}
                                                placeholder="ค้นหาจุดหมายปลายทาง (ระบุเลขที่บ้าน, อาคาร, ซอย)"
                                            />
                                        </FormField>

                                        {/* Lat/Long Display Fields */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <NavIcon size={12} className="text-blue-500" />
                                                    Latitude
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.lat || ''}
                                                    readOnly
                                                    placeholder="0.000000"
                                                    className="w-full bg-gray-50 border-gray-200 border-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 shadow-inner"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <NavIcon size={12} className="text-blue-500" />
                                                    Longitude
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.lon || ''}
                                                    readOnly
                                                    placeholder="0.000000"
                                                    className="w-full bg-gray-50 border-gray-200 border-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 shadow-inner"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 3 - Departure */}
                                    <FormField label="วันที่เดินทางไป" icon={Calendar} required>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            min={getTodayDate()}
                                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                                            onClick={(e) => (e.target as any).showPicker?.()}
                                            className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer" />
                                    </FormField>
                                    <FormField label="เวลาเดินทางไป" icon={Clock} required>
                                        <input
                                            type="time"
                                            value={formData.startTime}
                                            onChange={(e) => handleInputChange('startTime', e.target.value)}
                                            onClick={(e) => (e.target as any).showPicker?.()}
                                            className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer" />
                                    </FormField>

                                    {/* Row 4 - Return */}
                                    <FormField label="วันที่เดินทางกลับ" icon={Calendar} required>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            min={formData.startDate || getTodayDate()}
                                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                                            onClick={(e) => (e.target as any).showPicker?.()}
                                            className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer" />
                                    </FormField>
                                    <FormField label="เวลาเดินทางกลับ" icon={Clock} required>
                                        <input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={(e) => handleInputChange('endTime', e.target.value)}
                                            onClick={(e) => (e.target as any).showPicker?.()}
                                            className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer" />
                                    </FormField>

                                    {/* Self Drive Checkbox */}
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200">
                                            <input
                                                type="checkbox"
                                                checked={formData.selfDrive}
                                                onChange={(e) => handleInputChange('selfDrive', e.target.checked)}
                                                className="w-5 h-5 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                                            />
                                            <div className="flex items-center gap-2">
                                                <User className="w-5 h-5 text-emerald-600" />
                                                <span className="font-bold text-emerald-900">ขอขับเอง (Self Drive)</span>
                                            </div>
                                        </label>
                                    </div>


                                    {/* Message/Reason */}
                                    <div className="md:col-span-2">
                                        <FormField label={
                                            <div className="flex items-center gap-2">
                                                <span>หมายเหตุ</span>
                                                <span className="text-red-500 font-bold text-xs">
                                                    (** ในกรณีที่ต้องการขับเอง โปรดระบุชื่อผู้ขับในช่องนี้ **)
                                                </span>
                                            </div>
                                        } icon={MessageSquare} required>
                                            <textarea
                                                rows={3}
                                                value={formData.objective}
                                                onChange={(e) => handleInputChange('objective', e.target.value)}
                                                placeholder="ระบุวัตถุประสงค์ในการเดินทาง..."
                                                className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm resize-none"
                                            />
                                        </FormField>
                                    </div>

                                    {/* Passengers & Phone */}
                                    <FormField label="จำนวนผู้เดินทาง" icon={Users} required>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={formData.passengers}
                                                onChange={(e) => handleInputChange('passengers', e.target.value)}
                                                placeholder="0"
                                                min="1"
                                                className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">คน</span>
                                        </div>
                                    </FormField>
                                    <FormField label="หมายเลขโทรศัพท์ติดต่อ" icon={Phone} required>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            placeholder="0x-xxxx-xxxx"
                                            className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm" />
                                    </FormField>
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-50">
                                    <button
                                        onClick={resetForm}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-50">
                                        <X className="w-4 h-4" />
                                        ยกเลิกเนื้อหา
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all disabled:opacity-70">
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลคำขอ'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Table List Section */
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">รายการคำขอใช้รถยนต์ของคุณ</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 px-4 py-2 rounded-xl">
                            <Search className="w-4 h-4" />
                            <span>ค้นหาจากรายการทั้งหมด {myRequests.length} รายการ</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">ลำดับ / วันที่เดินทาง</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">จุดหมาย</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">สถานะ</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-medium">
                                {myRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-bold">
                                            ไม่พบรายการคำขอของคุณ
                                        </td>
                                    </tr>
                                ) : (
                                    myRequests.map((req: any) => {
                                        const statusConfig: any = {
                                            'Pending': { color: 'bg-yellow-50 text-yellow-600 border-yellow-100', text: 'รอการอนุมัติ' },
                                            '1': { color: 'bg-yellow-50 text-yellow-600 border-yellow-100', text: 'รอการอนุมัติ' }, 
                                            'Approved': { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', text: 'อนุมัติแล้ว' },
                                            'Rejected': { color: 'bg-red-50 text-red-600 border-red-100', text: 'ปฏิเสธคำขอ' },
                                            'Cancelled': { color: 'bg-gray-50 text-gray-400 border-gray-200', text: 'ยกเลิกแล้ว' },
                                            'Completed': { color: 'bg-blue-50 text-blue-600 border-blue-100', text: 'เสร็จสิ้นการใช้งาน' },
                                        };
                                        const config = statusConfig[req.status] || statusConfig['Pending'];

                                        return (
                                            <TableRow
                                                key={req.id}
                                                no={req.id}
                                                date={req.date}
                                                time={req.time}
                                                dest={req.destination}
                                                reason={req.objective}
                                                status={config.text}
                                                statusColor={config.color}
                                            />
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// เติม Component ที่ขาดหายไป เพื่อให้รันได้สมบูรณ์ไม่ Error
function FormField({ label, icon: Icon, required, children }: {
    label: React.ReactNode;
    icon: any;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Icon className="w-4 h-4 text-blue-500" />
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

// เติม TableRow Component เพื่อรองรับหน้า List
function TableRow({ no, date, time, dest, reason, status, statusColor }: any) {
    return (
        <tr className="hover:bg-gray-50/50 transition-colors">
            <td className="px-8 py-4">
                <div className="font-bold text-gray-900">{no}</div>
                <div className="text-sm text-gray-500">{date} • {time}</div>
            </td>
            <td className="px-8 py-4">
                <div className="font-bold text-gray-900 line-clamp-1">{dest}</div>
                <div className="text-sm text-gray-500 line-clamp-1">{reason}</div>
            </td>
            <td className="px-8 py-4 text-center">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                    {status}
                </span>
            </td>
            <td className="px-8 py-4 text-center">
                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                    <Eye className="w-5 h-5" />
                </button>
            </td>
        </tr>
    );
}