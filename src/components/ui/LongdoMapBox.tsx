'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search as SearchIcon, MapPin, Crosshair, Loader2, Maximize2 } from 'lucide-react';
import { searchLocation, suggestLocation } from '@/app/actions/mapActions';

const LONGDO_MAP_KEY = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY;

interface LongdoMapBoxProps {
    onLocationSelect: (loc: { name: string; lat: number; lon: number }) => void;
    placeholder?: string;
}

const LongdoMapBox: React.FC<LongdoMapBoxProps> = ({ onLocationSelect, placeholder }) => {
    const mapRef = useRef<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [selectedPos, setSelectedPos] = useState<{ lat: number; lon: number } | null>(null);

    useEffect(() => {
        // Load Script
        const scriptId = 'longdo-map-loader';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://api.longdo.com/map/?key=${LONGDO_MAP_KEY}`;
            script.async = true;
            script.onload = () => initMap();
            document.head.appendChild(script);
        } else {
            const checkReady = setInterval(() => {
                // @ts-ignore
                if (window.longdo) {
                    clearInterval(checkReady);
                    initMap();
                }
            }, 100);
        }

        function initMap() {
            if (mapRef.current) return;
            const canvas = document.getElementById('map-canvas');
            // @ts-ignore
            if (canvas && window.longdo) {
                // @ts-ignore
                const map = new window.longdo.Map({
                    placeholder: canvas,
                    lastview: false,
                    language: 'th'
                });
                mapRef.current = map;

                map.Event.bind('ready', () => {
                    setIsMapLoaded(true);

                    // ปักหมุดเมื่อคลิก - ใช้พิกัดจาก Pointer ปัจจุบัน
                    map.Event.bind('click', () => {
                        // @ts-ignore
                        const loc = map.location(window.longdo.LocationMode.Pointer);
                        if (loc) {
                            updatePin(loc, "ตำแหน่งที่เลือก");
                        }
                    });
                });
            }
        }
    }, []);

    const updatePin = (loc: any, name: string) => {
        // @ts-ignore
        if (!mapRef.current || !window.longdo) return;
        mapRef.current.Overlays.clear();
        // @ts-ignore
        const marker = new window.longdo.Marker(loc, {
            title: name,
            anchor: { x: 0.5, y: 1 } // ปลายหมุดตรงกับจุดที่จิ้ม
        });
        mapRef.current.Overlays.add(marker);
        setSelectedPos({ lat: loc.lat, lon: loc.lon });
        onLocationSelect({ name, lat: loc.lat, lon: loc.lon });
    };

    const executeSearch = async (keyword: string) => {
        if (!keyword || !mapRef.current) return;
        setIsSearching(true);
        setShowSuggestions(false);
        try {
            const result = await searchLocation(keyword);
            const data = Array.isArray(result) ? result : result?.data;
            if (data && data.length > 0) {
                const first = data[0];
                const loc = { lat: parseFloat(first.lat), lon: parseFloat(first.lon) };
                mapRef.current.location(loc, true);
                updatePin(loc, first.w || first.name);
                setSearchTerm(first.w || first.name);
            } else {
                alert('ไม่พบสถานที่นี้ครับ');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="w-full space-y-4 text-black font-sans">
            {/* Search Top Bar */}
            <div className="flex gap-2 relative">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={async (e) => {
                            const val = e.target.value;
                            setSearchTerm(val);
                            if (val.length > 1) {
                                const res = await suggestLocation(val);
                                const list = Array.isArray(res) ? res : res?.data;
                                setSuggestions(list || []);
                                setShowSuggestions(true);
                            } else {
                                setShowSuggestions(false);
                            }
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && executeSearch(searchTerm)}
                        placeholder={placeholder || "ค้นหายานพาหนะ/สถานที่..."}
                        className="w-full pl-11 pr-4 py-4 bg-white border-2 border-slate-100 rounded-3xl font-bold focus:border-blue-500 outline-none shadow-sm transition-all"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] max-h-60 overflow-y-auto">
                            {suggestions.map((s, i) => (
                                <div key={i} onClick={() => { setSearchTerm(s.w); setShowSuggestions(false); executeSearch(s.w); }}
                                    className="p-4 hover:bg-slate-50 cursor-pointer border-b last:border-0 font-bold text-sm text-slate-700">
                                    {s.w}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={() => executeSearch(searchTerm)} disabled={isSearching}
                    className="bg-blue-600 text-white px-8 py-4 rounded-3xl font-black hover:bg-blue-700 active:scale-95 transition-all shadow-xl flex items-center gap-2">
                    {isSearching ? <Loader2 className="animate-spin" size={20} /> : 'ค้นหา'}
                </button>
            </div>

            {/* Map Container - ขยายสูงขึ้นเพื่อให้ลากสนุก */}
            <div className="relative w-full h-[550px] rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl bg-slate-100 ring-1 ring-slate-200">
                <div id="map-canvas" className="w-full h-full"></div>

                {!isMapLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-50">
                        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                        <span className="font-bold text-slate-400">กำลังโหลดแผนที่แบบอิสระ...</span>
                    </div>
                )}

                {/* Left Side Buttons (Zoom & GPS) */}
                <div className="absolute top-6 right-6 flex flex-col gap-3 z-10">
                    <button onClick={() => mapRef.current?.zoom(mapRef.current.zoom() + 1, true)}
                        className="w-12 h-12 bg-white shadow-2xl rounded-2xl font-black text-2xl hover:text-blue-600 flex items-center justify-center border border-slate-50 transition-all active:scale-90">+</button>
                    <button onClick={() => mapRef.current?.zoom(mapRef.current.zoom() - 1, true)}
                        className="w-12 h-12 bg-white shadow-2xl rounded-2xl font-black text-2xl hover:text-blue-600 flex items-center justify-center border border-slate-50 transition-all active:scale-90">-</button>
                    <button onClick={() => {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(p => {
                                const loc = { lat: p.coords.latitude, lon: p.coords.longitude };
                                mapRef.current.location(loc, true);
                                updatePin(loc, 'ตำแหน่งปัจจุบัน');
                            });
                        }
                    }} className="w-12 h-12 bg-white shadow-2xl rounded-2xl flex items-center justify-center text-slate-500 hover:text-blue-600 border border-slate-50 active:scale-90 transition-all">
                        <Crosshair size={22} />
                    </button>
                    <button onClick={() => window.location.reload()} className="w-12 h-12 bg-white shadow-2xl rounded-2xl flex items-center justify-center text-slate-500 hover:text-emerald-600 border border-slate-50 active:scale-90 transition-all">
                        <Maximize2 size={20} />
                    </button>
                </div>

                {/* Coordinate Badge */}
                {selectedPos && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-6 py-2.5 rounded-full text-[11px] font-black backdrop-blur-md border border-white/20 shadow-2xl z-10 tracking-widest">
                        LAT: {selectedPos.lat.toFixed(6)} | LON: {selectedPos.lon.toFixed(6)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LongdoMapBox;
