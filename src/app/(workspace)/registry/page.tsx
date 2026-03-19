'use client';

import { useState, useEffect } from 'react';
import { Car, User } from 'lucide-react';

import VehicleTab from './VehicleTab';
import DriverTab from './DriverTab';

export default function RegistryPage() {
    const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');
    const [options, setOptions] = useState<any>(null);

    // Fetch options for forms
    useEffect(() => {
        fetch('/api/options')
            .then(res => res.json())
            .then(data => {
                setOptions(data);
            })
            .catch(err => console.error("Failed to load options", err));
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                        {activeTab === 'vehicles' ? <Car className="w-8 h-8 text-white" /> : <User className="w-8 h-8 text-white" />}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">ระบบจัดการข้อมูล</h1>
                        <p className="text-gray-500 font-medium mt-1">Car Register & Driver Master</p>
                    </div>
                </div>

                <div className="flex bg-gray-50/80 border border-gray-100 p-1.5 rounded-2xl shadow-inner">
                    <button
                        onClick={() => setActiveTab('vehicles')}
                        className={`px-8 py-3 rounded-[1rem] text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'vehicles' ? 'bg-white text-slate-900 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                    >
                        <Car size={18} />
                        ข้อมูลรถยนต์ (Vehicles)
                    </button>
                    <button
                        onClick={() => setActiveTab('drivers')}
                        className={`px-8 py-3 rounded-[1rem] text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'drivers' ? 'bg-white text-slate-900 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                    >
                        <User size={18} />
                        ข้อมูลคนขับ (Drivers)
                    </button>
                </div>
            </div>

            {/* Render Tab Content */}
            <div className="transition-all">
                {activeTab === 'vehicles' ? <VehicleTab options={options} /> : <DriverTab options={options} />}
            </div>
            
            {/* Toast Container if needed */}
        </div>
    );
}