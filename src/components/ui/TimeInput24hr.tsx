"use client";
import Select from "react-select";

interface TimeInput24hrProps {
  value: string;
  onChange: (value: string) => void;
  showDate?: boolean; // เพิ่ม prop นี้
  disabled?: boolean;
  className?: string;
}

const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, "0"),
  label: String(i).padStart(2, "0"),
}));

const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
  value: String(i).padStart(2, "0"),
  label: String(i).padStart(2, "0"),
}));

const selectStyles = (disabled: boolean) => ({
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    backgroundColor: disabled
      ? "#f3f4f6"
      : state.isFocused
        ? "#ffffff"
        : "#f9fafb",
    boxShadow: state.isFocused ? "0 0 0 2px #eff6ff" : "none",
    borderWidth: "1px",
    minHeight: "51px",
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#eff6ff"
      : state.isFocused
        ? "#f8fafc"
        : "#ffffff",
    color: "#000000",
    padding: "0.5rem 1rem",
  }),
  singleValue: (base: any) => ({
    ...base,
    fontWeight: "bold",
    color: "#000000",
  }),
  placeholder: (base: any) => ({
    // ✅ เหลือแค่อันเดียว
    ...base,
    color: "#6b7280", // gray-500
    fontSize: "0.875rem",
    fontWeight: "bold",
  }),
  menu: (base: any) => ({ ...base, borderRadius: "0.5rem", zIndex: 100 }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  menuList: (base: any) => ({ ...base, maxHeight: "180px" }),
});

export default function TimeInput24hr({
  value,
  onChange,
  showDate = false,
  disabled = false,
  className,
}: TimeInput24hrProps) {
  const date = showDate ? (value ? value.split("T")[0] : "") : null;
  const time = showDate ? (value ? value.split("T")[1] : "") : value;
  const hours = time ? time.split(":")[0] : null;
  const minutes = time ? time.split(":")[1] : null;

  const handleDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(`${e.target.value}T${time || "00:00"}`);
  };

  const handleHours = (sel: any) => {
    const newTime = `${sel.value}:${minutes ?? "00"}`;
    onChange(
      showDate
        ? `${date || new Date().toISOString().split("T")[0]}T${newTime}`
        : newTime,
    );
  };

  const handleMinutes = (sel: any) => {
    const newTime = `${hours ?? "00"}:${sel.value}`;
    onChange(
      showDate
        ? `${date || new Date().toISOString().split("T")[0]}T${newTime}`
        : newTime,
    );
  };

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {showDate && (
        <input
          type="date"
          value={date ?? ""}
          disabled={disabled}
          onChange={handleDate}
          onClick={(e) => (e.target as any).showPicker?.()}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-gray-700 font-bold disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-500"
        />
      )}
      <div className="flex items-center gap-2">
        <Select
          options={hourOptions}
          value={hours ? { value: hours, label: hours } : null}
          onChange={handleHours}
          placeholder="ชม."
          isDisabled={disabled}
          styles={selectStyles(disabled)}
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : null
          }
          menuPosition="fixed"
          className="flex-1"
        />
        <span className="font-bold text-gray-500 text-lg">:</span>
        <Select
          options={minuteOptions}
          value={minutes ? { value: minutes, label: minutes } : null}
          onChange={handleMinutes}
          placeholder="นาที"
          isDisabled={disabled}
          styles={selectStyles(disabled)}
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : null
          }
          menuPosition="fixed"
          className="flex-1"
        />
      </div>
    </div>
  );
}
