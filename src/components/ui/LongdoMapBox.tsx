"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Search as SearchIcon,
  Loader2,
  MapPin,
  Navigation,
} from "lucide-react";
import { searchLocation, suggestLocation } from "@/app/actions/mapActions";

interface LongdoMapBoxProps {
  onLocationSelect: (loc: { name: string; lat: number; lon: number }) => void;
  placeholder?: string;
}

const LONGDO_KEY = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY;

const MapBox: React.FC<LongdoMapBoxProps> = ({
  onLocationSelect,
  placeholder,
}) => {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onLocationSelectRef = useRef(onLocationSelect);

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPos, setSelectedPos] = useState<{
    lat: number;
    lon: number;
    name?: string;
  } | null>(null);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    setSelectedPos(null);
    setSearchTerm("");
    markerRef.current = null;
    mapRef.current = null;

    if (!containerRef.current) return;

    if (!document.getElementById("longdo-map-script")) {
      const script = document.createElement("script");
      script.id = "longdo-map-script";
      script.src = `https://api.longdo.com/map/?key=${LONGDO_KEY}`;
      script.async = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapRef.current) {
        const { map } = mapRef.current;
        if (markerRef.current) {
          map.Overlays.remove(markerRef.current);
          markerRef.current = null;
        }
        map.Overlays.clear();
        map.location({ lon: 100.4679613, lat: 13.7245447 }, false); // ✅ false = ไม่มี animation
        map.zoom(12, false); // ✅ false = ไม่มี animation
        mapRef.current = null;
      }
      setSelectedPos(null);
      setSearchTerm("");
    };
  }, []);

  const initMap = () => {
    const longdo = (window as any).longdo;
    if (!longdo || !containerRef.current || mapRef.current) return;

    const map = new longdo.Map({
      placeholder: containerRef.current,
      language: "th",
      location: { lon: 100.5018, lat: 13.7563 },
      zoom: 12,
    });

    map.Ui.DPad.visible(false);
    map.Ui.Zoombar.visible(false);
    map.Ui.Geolocation.visible(false);
    map.Ui.Crosshair.visible(false);
    if (map.Ui.Scale) map.Ui.Scale.visible(false);

    map.Event.bind("click", async (result: any) => {
      const savedResult = { x: result.x, y: result.y };

      map.resize();
      await new Promise((r) => setTimeout(r, 200));

      const location = map.location(savedResult);
      const lat = location?.lat;
      const lon = location?.lon;

      console.log("savedResult:", savedResult, "location:", location);

      if (lat == null || lon == null) return;

      try {
        const res = await fetch(
          `https://api.longdo.com/map/services/address?lat=${lat}&lon=${lon}&key=${LONGDO_KEY}`,
        );
        const addr = await res.json();
        const parts = [];
        if (addr.aoi) parts.push(addr.aoi);
        else if (addr.poi) parts.push(addr.poi);
        else {
          if (addr.road) parts.push(addr.road);
          if (addr.district) parts.push(addr.district);
        }
        const name = parts.length > 0 ? parts.join(", ") : "ไม่ทราบชื่อสถานที่";
        updatePin(map, longdo, lat, lon, name);
        setSearchTerm(name);
      } catch {
        updatePin(map, longdo, lat, lon, "ตำแหน่งที่เลือก");
      }
    });
    mapRef.current = { map, longdo };
  };

  const updatePin = (
    map: any,
    longdo: any,
    lat: number,
    lon: number,
    name: string,
  ) => {
    if (markerRef.current) {
      map.Overlays.remove(markerRef.current);
    }

    const htmlObj = document.createElement("div");
    htmlObj.innerHTML = `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%); pointer-events:none;">
         <div style="background:#ef4444; color:white; padding:10px; border-radius:50%; box-shadow:0 10px 15px -3px rgba(0,0,0,0.3); animation:mapbounce 1s infinite alternate;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
         </div>
      </div>
      <style>@keyframes mapbounce { from { transform: translateY(0); } to { transform: translateY(-7px); } }</style>
    `;

    const marker = new longdo.Marker(
      { lon, lat },
      { title: name, detail: name, html: htmlObj },
    );
    map.Overlays.add(marker);
    markerRef.current = marker;
    setSelectedPos({ lat, lon, name });
    onLocationSelectRef.current({ name, lat, lon });

    // Smooth pan to selected location
    map.location({ lon, lat }, true);
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
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        const { map } = mapRef.current;

        map.zoom(16, true);
        map.location({ lon, lat }, true);

        setSearchTerm(keyword);
      } else {
        alert("ไม่พบสถานที่");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full space-y-5 text-black font-sans">
      {/* Premium Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 relative z-[2000]">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <SearchIcon
              className="text-blue-500 transition-transform group-focus-within:scale-110"
              size={20}
            />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={async (e) => {
              const val = e.target.value;
              setSearchTerm(val);
              if (val.trim().length > 0) {
                const res = await suggestLocation(val);
                const list = Array.isArray(res) ? res : res?.data;
                setSuggestions(list || []);
                setShowSuggestions(true);
              } else {
                setShowSuggestions(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                executeSearch(searchTerm);
              }
            }}
            onFocus={() => {
              if (searchTerm.trim().length > 0 && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
            placeholder={placeholder || "ค้นหาสถานที่..."}
            className="w-full pl-14 pr-4 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-slate-700 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none shadow-sm transition-all text-[15px]"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-16 left-0 w-full bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] z-[3000] max-h-72 overflow-y-auto overflow-x-hidden">
              <div className="p-2">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSearchTerm(s.w);
                      setShowSuggestions(false);
                      executeSearch(s.w);
                    }}
                    className="px-4 py-3 hover:bg-blue-50 rounded-xl cursor-pointer flex items-center gap-3 transition-colors group/item"
                  >
                    <div className="bg-gray-100 p-2 rounded-full group-hover/item:bg-blue-100 transition-colors shrink-0">
                      <MapPin
                        size={16}
                        className="text-gray-500 group-hover/item:text-blue-600"
                      />
                    </div>
                    <span className="font-bold text-sm text-slate-700">
                      {s.w}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            executeSearch(searchTerm);
          }}
          disabled={isSearching}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 flex-shrink-0"
        >
          {isSearching ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <SearchIcon size={20} />
          )}
          ค้นหา
        </button>
      </div>

      {/* Map Area */}
      <div
        className="relative w-full rounded-[2rem] overflow-hidden border border-gray-200 shadow-[0_10px_40px_-5px_rgba(0,0,0,0.05)] bg-slate-50 group block hover:border-blue-300 transition-colors duration-500"
        style={{ height: "450px" }}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Loading Overlay */}
        {!mapRef.current && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 z-0 bg-white">
            <Loader2
              className="animate-spin mb-3 text-blue-500"
              size={40}
              strokeWidth={3}
            />
            <span className="text-sm font-bold animate-pulse text-slate-500">
              กำลังเตรียมแผนที่...
            </span>
          </div>
        )}

        <div
          ref={containerRef}
          className="absolute inset-0 z-10 outline-none"
          onMouseEnter={() => {
            if (containerRef.current)
              containerRef.current.style.pointerEvents = "auto";
          }}
        />

        {/* Floating Instruction */}
        {!selectedPos && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-white z-[1000] flex items-center gap-2 pointer-events-none">
            <Navigation size={16} className="text-blue-600 animate-bounce" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-wide text-center">
              คลิกจุดหมายบนแผนที่เพื่อปักหมุด
            </span>
          </div>
        )}

        {/* Floating Selected Info */}
        {selectedPos && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[26rem] bg-slate-900/95 backdrop-blur-xl text-white p-5 rounded-2xl shadow-2xl z-[1000] border border-slate-700 flex flex-col gap-2 pointer-events-auto">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl text-white shadow-inner shrink-0 shadow-lg shadow-blue-500/20">
                <MapPin size={26} fill="currentColor" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-[10px] text-blue-300 font-black tracking-widest uppercase mb-1 drop-shadow-sm">
                  ตำแหน่งที่เลือก
                </p>
                <p
                  className="text-[15px] font-bold text-white leading-tight line-clamp-2"
                  title={selectedPos.name}
                >
                  {selectedPos.name || "ไม่ทราบชื่อสถานที่"}
                </p>
              </div>
            </div>
            <div className="mt-2 pt-3 border-t border-slate-700/80 flex justify-between items-center text-xs font-medium font-mono text-slate-400">
              <span>LAT: {selectedPos.lat.toFixed(6)}</span>
              <span>LON: {selectedPos.lon.toFixed(6)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapBox;
