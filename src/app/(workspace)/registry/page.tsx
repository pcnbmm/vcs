'use client';

import { useState } from 'react';
import {
    Car,
    UserCircle,
} from 'lucide-react';

import VehicleTab from './VehicleTab';
import DriverTab from './DriverTab';

export default function RegistryPage() {
    const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">


            {/* Tab Navigation */}
            <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100 w-full sm:w-fit">
                <button
                    onClick={() => setActiveTab('vehicles')}
                    className={`flex items-center justify-center gap-2 flex-1 sm:w-48 py-3 rounded-xl font-bold text-sm transition-all ${
                        activeTab === 'vehicles'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                    <Car size={18} />
                    ยานพาหนะ
                </button>
                <button
                    onClick={() => setActiveTab('drivers')}
                    className={`flex items-center justify-center gap-2 flex-1 sm:w-48 py-3 rounded-xl font-bold text-sm transition-all ${
                        activeTab === 'drivers'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                    <UserCircle size={18} />
                    ผู้ขับรถ
                </button>
            </div>

            {/* Active Tab Content */}
            <div className="mt-4">
                {activeTab === 'vehicles' ? <VehicleTab /> : <DriverTab />}
            </div>
        </div>
    );
}