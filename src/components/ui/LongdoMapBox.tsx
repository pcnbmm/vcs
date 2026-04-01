"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search as SearchIcon, Loader2 } from "lucide-react";
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
  } | null>(null);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    // โหลด Longdo Map SDK
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
        mapRef.current = null;
      }
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

    map.Event.bind("click", async () => {
      const location = map.location();
      const lat = location.lat;
      const lon = location.lon;

      try {
        const res = await fetch(
          `https://api.longdo.com/map/services/address?lat=${lat}&lon=${lon}&key=${LONGDO_KEY}`,
        );
        const addr = await res.json();
        const parts = [];
        if (addr.aoi) parts.push(addr.aoi);
        else {
          if (addr.road) parts.push(addr.road);
          if (addr.district) parts.push(addr.district);
        }
        const name = parts.length > 0 ? parts.join(", ") : "ตำแหน่งที่เลือก";
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
    const marker = new longdo.Marker(
      { lon, lat },
      { title: name, detail: name },
    );
    map.Overlays.add(marker);
    markerRef.current = marker;
    setSelectedPos({ lat, lon });
    onLocationSelectRef.current({ name, lat, lon });
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
        const { map, longdo } = mapRef.current;
        map.location({ lon, lat }, true);
        map.zoom(16, true);
        updatePin(map, longdo, lat, lon, first.w || first.name || keyword);
        setSearchTerm(first.w || first.name || keyword);
      } else {
        alert("ไม่พบสถานที่นี้ครับ");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full space-y-3 text-black">
      {/* Search Bar */}
      <div className="flex gap-2 relative">
        <div className="relative flex-1">
          <SearchIcon
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
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
            onKeyDown={(e) => e.key === "Enter" && executeSearch(searchTerm)}
            placeholder={placeholder || "ค้นหาสถานที่..."}
            className="w-full pl-11 pr-4 py-4 bg-white border-2 border-slate-100 rounded-3xl font-bold focus:border-blue-500 outline-none shadow-sm transition-all"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl z-[1000] max-h-60 overflow-y-auto">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSearchTerm(s.w);
                    setShowSuggestions(false);
                    executeSearch(s.w);
                  }}
                  className="p-4 hover:bg-slate-50 cursor-pointer border-b last:border-0 font-bold text-sm text-slate-700"
                >
                  {s.w}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => executeSearch(searchTerm)}
          disabled={isSearching}
          className="bg-blue-600 text-white px-8 py-4 rounded-3xl font-black hover:bg-blue-700 active:scale-95 transition-all shadow-xl flex items-center gap-2"
        >
          {isSearching ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            "ค้นหา"
          )}
        </button>
      </div>

      {/* Map */}
      <div
        className="relative w-1/2 mx-auto rounded-[1.5rem] overflow-hidden border-2 border-slate-200 shadow-lg"
        style={{ height: "350px" }}
      >
        <div ref={containerRef} className="w-full h-full" />
        {selectedPos && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-4 py-2 rounded-full text-[11px] font-black z-[1000] tracking-widest whitespace-nowrap">
            LAT: {selectedPos.lat.toFixed(6)} | LON:{" "}
            {selectedPos.lon.toFixed(6)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapBox;
