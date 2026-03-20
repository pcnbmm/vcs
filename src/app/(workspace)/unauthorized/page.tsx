import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="w-full h-[80vh] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-rose-100 flex flex-col items-center text-center max-w-lg">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10 text-rose-500" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-3">ไม่มีสิทธิ์เข้าถึง</h1>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    คุณไม่ได้รับสิทธิ์ให้เข้าถึงหน้าเมนูนี้ กรุณาติดต่อผู้ดูแลระบบหากคุณเชื่อว่านี่คือข้อผิดพลาด
                </p>
                <Link 
                    href="/" 
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                    กลับหน้าหลัก (Dashboard)
                </Link>
            </div>
        </div>
    );
}
