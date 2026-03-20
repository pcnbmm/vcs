"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { searchLocation, suggestLocation } from "@/app/actions/mapActions";

interface LongdoMapBoxProps {
  onLocationSelect: (loc: { name: string; lat: number; lon: number }) => void;
  placeholder?: string;
}

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

    // โหลด Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (mapRef.current) return;

      // แก้ icon path สำหรับ Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: [13.7563, 100.5018], // กรุงเทพ
        zoom: 12,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      // ปักหมุดเมื่อคลิก
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        updatePin(map, L, lat, lng, "ตำแหน่งที่เลือก");
      });

      mapRef.current = { map, L };
    });

    return () => {
      if (mapRef.current?.map) {
        mapRef.current.map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const updatePin = (
    map: any,
    L: any,
    lat: number,
    lng: number,
    name: string,
  ) => {
    if (markerRef.current) {
      markerRef.current.remove();
    }
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(name).openPopup();
    markerRef.current = marker;
    setSelectedPos({ lat, lon: lng });
    onLocationSelectRef.current({ name, lat, lon: lng });
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
        const lng = parseFloat(first.lon);
        const { map, L } = mapRef.current;
        map.setView([lat, lng], 16); // ← เลื่อนไปตำแหน่ง
        updatePin(map, L, lat, lng, first.w || first.name || keyword);
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
