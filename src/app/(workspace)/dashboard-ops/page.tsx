import React from 'react';
import { 
  Car, Clock, Wrench, CheckCircle, AlertCircle, PieChart, BarChart3, TrendingUp, Users, ShieldAlert, ArrowRight, Activity
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function OperationsDashboard() {
  // ==========================================
  // Data Fetching from Real Database (Prisma)
  // ==========================================
  
  // 1. KPI Data
  const totalRequests = await prisma.vc_order_item.count();
  const pendingRequests = await prisma.vc_order_item.count({
    where: { status_use_id: { in: [1, 2, 3] } }
  });
  const inMaintenance = await prisma.vc_maintenance_item.count({
    where: { finish_date: null }
  });
  
  const today = new Date();
  // overdueReturns count moved down to be calculated accurately from filtered items.

  // 2. Vehicle Overview
  const totalVehicles = await prisma.vc_car_master.count();
  const rentedVehicles = await prisma.vc_rent_car.count();
  const companyVehicles = totalVehicles - rentedVehicles;
  const companyPct = totalVehicles > 0 ? Math.round((companyVehicles / totalVehicles) * 100) : 0;
  const rentPct = totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;

  // 3. Vehicle Types Breakdown
  const carTypesMaster = await prisma.vc_car_type.findMany();
  const carTypesCount = await prisma.vc_car_master.groupBy({
    by: ['car_type_id'],
    _count: true,
  });
  
  const colors = ['bg-[#3b82f6]', 'bg-[#6366f1]', 'bg-[#f59e0b]', 'bg-[#ec4899]', 'bg-[#14b8a6]', 'bg-[#64748b]'];
  const vehicleTypeStats = carTypesCount
    .map((ct, index) => {
      const typeInfo = carTypesMaster.find(t => t.car_type_id === ct.car_type_id);
      return {
        name: typeInfo?.car_type_name || 'ไม่ระบุ',
        count: ct._count,
        pct: totalVehicles > 0 ? Math.round((ct._count / totalVehicles) * 100) + '%' : '0%',
        color: colors[index % colors.length]
      };
    })
    .sort((a, b) => b.count - a.count);

  // 4. Approval Statuses
  const statusCounts = await prisma.vc_order_item.groupBy({
    by: ['status_use_id'],
    _count: true,
  });
  
  let approvedCount = 0;
  let rejectedCount = 0;
  let otherStatusCount = 0;
  statusCounts.forEach(s => {
    if (s.status_use_id === 9) rejectedCount += s._count;
    else if (s.status_use_id && s.status_use_id >= 3 && s.status_use_id <= 6) approvedCount += s._count;
    else otherStatusCount += s._count;
  });
  const totalStatuses = approvedCount + rejectedCount + otherStatusCount || 1;
  const approvedPct = Math.round((approvedCount / totalStatuses) * 100);
  const rejectedPct = Math.round((rejectedCount / totalStatuses) * 100);
  const otherPct = 100 - approvedPct - rejectedPct;

  // 5. Reasons for Request
  const reasonsRaw = await prisma.vc_order_item.groupBy({
    by: ['journey_causes'],
    _count: true,
    orderBy: { _count: { journey_causes: 'desc' } },
    take: 6
  });
  const totalReasons = reasonsRaw.reduce((sum, r) => sum + r._count, 0) || 1;
  const reasonsStats = reasonsRaw.map((r, i) => ({
    label: r.journey_causes || 'ไม่ระบุเหตุผล / ว่าง',
    count: r._count,
    val: Math.round((r._count / totalReasons) * 100) + '%',
    color: colors[i % colors.length]
  }));

  // 6. Maintenance Causes
  const causesMaster = await prisma.vc_maintenance_cause.findMany();
  const mainCausesRaw = await prisma.vc_maintenance_item.groupBy({
    by: ['cause_id'],
    _count: true,
    orderBy: { _count: { cause_id: 'desc' } },
    take: 5
  });
  const totalMainCauses = mainCausesRaw.reduce((sum, r) => sum + r._count, 0) || 1;
  const mainCausesStats = mainCausesRaw.map((mc, i) => {
    const causeInfo = causesMaster.find(c => c.cause_id === mc.cause_id);
    return {
      name: causeInfo?.cause_detail || 'ไม่ระบุ',
      count: mc._count,
      pct: Math.round((mc._count / totalMainCauses) * 100) + '%',
      color: 'bg-indigo-500'
    };
  });

  // 7. Overdue List Fetch
  const rawOverdueItems = await prisma.vc_order_item.findMany({
    where: {
      status_use_id: 4, // 4 = กำลังใช้งาน (ยังไม่คืน)
      return_date: { lt: today }
    },
    include: {
      vc_car_master: true,
      vc_user: true
    },
    orderBy: { return_date: 'asc' }
  });
  
  const validOverdueItems = rawOverdueItems.filter(
    item => item.vc_car_master?.car_number && item.vc_car_master.car_number.trim() !== '' && item.vc_car_master.car_number !== 'ไม่ระบุ'
  );
  
  const overdueReturns = validOverdueItems.length;
  const overdueItems = validOverdueItems.slice(0, 6);

  // 8. REAL Trend Data (Months)
  const allOrdersForTrend = await prisma.vc_order_item.findMany({
    select: { cre_date: true }
  });
  
  const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const monthlyData: Record<string, number> = {};
  
  allOrdersForTrend.forEach(o => {
    if (o.cre_date) {
      const d = new Date(o.cre_date);
      const mName = monthNames[d.getMonth()];
      monthlyData[mName] = (monthlyData[mName] || 0) + 1;
    }
  });

  const trendStats = monthNames
    .filter(m => monthlyData[m] !== undefined)
    .map(m => ({
      month: m,
      count: monthlyData[m]
    }));
  
  const maxTrend = Math.max(...trendStats.map(t => t.count), 1);

  // ==========================================
  // Render UI
  // ==========================================
  return (
    <div className="p-6 lg:p-10 bg-[#f4f7f9] min-h-screen font-sans text-slate-800">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Operations Dashboard</h1>
        <p className="text-slate-500 font-medium mt-1">สรุปภาพรวมและสถานะการปฏิบัติงาน (Live Data)</p>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* ----------------- ROW 1: KPI Cards ----------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            { label: 'คำขอใช้รถทั้งหมด', value: totalRequests, unit: 'รายการ', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-100' },
            { label: 'รออนุมัติ / จัดรถ', value: pendingRequests, unit: 'รายการ', icon: Car, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-100' },
            { label: 'เลยกำหนดคืน (Overdue)', value: overdueReturns, unit: 'คัน', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-100' },
            { label: 'กำลังซ่อมบำรุง', value: inMaintenance, unit: 'คัน', icon: Wrench, color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-100' }
          ].map((kpi, i) => (
            <div key={i} className={`bg-white rounded-3xl p-6 border ${kpi.border} shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow duration-300`}>
              <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-bold mb-1 tracking-wide">{kpi.label}</p>
                <h3 className="text-3xl font-black tracking-tighter">
                  {kpi.value.toLocaleString()} <span className="text-sm font-bold text-slate-400">{kpi.unit}</span>
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* ----------------- ROW 2: Main Layout ----------------- */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* LEFT COLUMN (Span 8) */}
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-8">
            
            {/* Request Trends Chart */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 flex flex-col flex-1 min-h-[360px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black flex items-center tracking-tight">
                  <Activity className="mr-3 text-indigo-500" size={24} strokeWidth={2.5} />
                  สถิติจำนวนการขอใช้งานรถยนต์รายเดือน
                </h2>
              </div>
              
              {trendStats.length > 0 ? (
                <div className="flex-1 flex items-end justify-between border-b-2 border-slate-100 pb-0 relative mt-4">
                  <div className="w-full flex justify-around items-end h-full">
                    {trendStats.map((item, i) => {
                      const heightPct = Math.max((item.count / maxTrend) * 100, 8);
                      return (
                        <div key={i} className="flex flex-col items-center justify-end group h-full w-full relative">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-800 text-white text-xs py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap font-bold z-10">
                            {item.count} รายการ
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                          </div>
                          <div className="w-16 md:w-20 bg-gradient-to-t from-indigo-500 to-blue-400 rounded-t-xl hover:from-indigo-400 hover:to-blue-300 transition-all shadow-md relative overflow-hidden" style={{ height: `${heightPct}%` }}>
                            <div className="absolute inset-0 bg-white/20 w-full h-1.5"></div>
                          </div>
                          <span className="text-sm font-bold text-slate-500 mt-4 mb-2">{item.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">ยังไม่มีข้อมูลการขอใช้งาน</div>
              )}
            </div>

            {/* Approval Status & Reasons Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Approval Card */}
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 flex flex-col justify-between">
                <h2 className="text-lg font-black mb-8 flex items-center tracking-tight">
                  <CheckCircle className="mr-3 text-emerald-500" size={22} strokeWidth={2.5} />
                  สถานะการอนุมัติการขอใช้งาน
                </h2>
                
                <div className="flex flex-col justify-center flex-1">
                  <div className="flex w-full h-4 rounded-full overflow-hidden bg-slate-100 mb-8 shadow-inner">
                    {approvedPct > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${approvedPct}%` }}></div>}
                    {otherPct > 0 && <div className="bg-amber-400 h-full" style={{ width: `${otherPct}%` }}></div>}
                    {rejectedPct > 0 && <div className="bg-rose-500 h-full" style={{ width: `${rejectedPct}%` }}></div>}
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="bg-emerald-50 rounded-2xl p-4 flex justify-between items-center border border-emerald-100/50 hover:bg-emerald-100/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm"></div>
                        <span className="text-sm font-bold text-emerald-800 tracking-wide">อนุมัติจัดรถ</span>
                      </div>
                      <span className="text-2xl font-black text-emerald-600">{approvedPct}%</span>
                    </div>
                    
                    <div className="bg-amber-50 rounded-2xl p-4 flex justify-between items-center border border-amber-100/50 hover:bg-amber-100/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-sm"></div>
                        <span className="text-sm font-bold text-amber-800 tracking-wide">สถานะอื่นๆ</span>
                      </div>
                      <span className="text-2xl font-black text-amber-600">{otherPct}%</span>
                    </div>
                    
                    <div className="bg-rose-50 rounded-2xl p-4 flex justify-between items-center border border-rose-100/50 hover:bg-rose-100/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-sm"></div>
                        <span className="text-sm font-bold text-rose-800 tracking-wide">ไม่อนุมัติ</span>
                      </div>
                      <span className="text-2xl font-black text-rose-600">{rejectedPct}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reasons Card */}
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 flex flex-col justify-between">
                <h2 className="text-lg font-black mb-6 flex items-center tracking-tight">
                  <PieChart className="mr-3 text-blue-500" size={22} strokeWidth={2.5} />
                  เหตุผลในการขอใช้งานรถยนต์
                </h2>
                <div className="space-y-4 flex-1 flex flex-col justify-center">
                  {reasonsStats.length > 0 ? reasonsStats.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-slate-700 truncate pr-4">{item.label}</span>
                        <span className="font-black text-slate-800 shrink-0">{item.count} <span className="text-xs text-slate-400 font-medium">({item.val})</span></span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className={`${item.color} h-full rounded-full`} style={{ width: item.val }}></div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-sm text-slate-400 py-4 font-medium">ไม่พบข้อมูล</div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (Span 4) - Vehicle Overview Megacard */}
          <div className="col-span-12 xl:col-span-4 flex flex-col">
            <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col h-full overflow-hidden">
              
              {/* Total Header Section */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-8 text-white relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                <h2 className="text-sm font-bold text-blue-200 uppercase tracking-widest mb-2 relative z-10">จำนวนรถทั้งหมดในองค์กร</h2>
                <div className="flex items-baseline gap-2 relative z-10">
                  <span className="text-7xl font-black drop-shadow-lg tracking-tighter">{totalVehicles.toLocaleString()}</span>
                  <span className="text-xl font-bold text-blue-300">คัน</span>
                </div>
              </div>

              {/* Owner Types Section */}
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-800 mb-5 tracking-wide">สัดส่วนประเภทเจ้าของรถ</h3>
                <div className="w-full flex h-4 rounded-full overflow-hidden mb-5 bg-slate-200 shadow-inner">
                  {companyPct > 0 && <div className="bg-[#10b981]" style={{ width: `${companyPct}%` }}></div>}
                  {rentPct > 0 && <div className="bg-[#f59e0b]" style={{ width: `${rentPct}%` }}></div>}
                </div>
                <div className="flex flex-col gap-2.5 text-sm font-bold">
                  <div className="flex items-center justify-between text-slate-700 bg-white/60 p-2.5 rounded-xl border border-slate-200/60 shadow-sm">
                    <div className="flex items-center"><span className="w-3.5 h-3.5 bg-[#10b981] rounded-full mr-3 shadow-sm"></span> รถบริษัท</div>
                    <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{companyVehicles.toLocaleString()} คัน</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 bg-white/60 p-2.5 rounded-xl border border-slate-200/60 shadow-sm">
                    <div className="flex items-center"><span className="w-3.5 h-3.5 bg-[#f59e0b] rounded-full mr-3 shadow-sm"></span> รถเช่า</div>
                    <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{rentedVehicles.toLocaleString()} คัน</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Types Section */}
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-sm font-black text-slate-800 mb-6 tracking-wide">จำแนกตามประเภทรถ</h3>
                <div className="space-y-5 flex-1">
                  {vehicleTypeStats.length > 0 ? vehicleTypeStats.map((type, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-end text-sm font-bold mb-2">
                        <span className="text-slate-700 truncate pr-3">{type.name}</span>
                        <span className="text-slate-800 shrink-0 bg-slate-100 px-2.5 py-1 rounded-lg">{type.count.toLocaleString()} <span className="text-xs text-slate-400 font-medium">คัน</span></span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`${type.color} h-full rounded-full`} style={{ width: type.pct }}></div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-sm text-slate-400 py-4 font-medium">ไม่พบข้อมูล</div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ----------------- ROW 3: Operations Bottom Section ----------------- */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* Overdue List (Span 7) */}
          <div className="col-span-12 xl:col-span-7">
            <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="bg-red-50 p-6 border-b border-red-100 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-black text-red-700 flex items-center tracking-tight">
                  <ShieldAlert className="mr-3" size={22} strokeWidth={2.5} />
                  ต้องติดตามด่วน (เกินกำหนดคืน)
                </h3>
                <span className="bg-red-100 text-red-700 text-sm font-black px-4 py-1.5 rounded-full shadow-sm">{overdueReturns} คัน</span>
              </div>
              
              <div className="p-3 flex-1">
                {overdueItems.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {overdueItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl">
                        <div className="flex items-center gap-5 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 border border-red-100">
                            <Car size={24} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-slate-800 text-base mb-1 truncate">{item.vc_car_master?.car_number || 'ไม่ระบุทะเบียน'}</div>
                            <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 truncate">
                              <Users size={14} className="text-slate-400 shrink-0"/> <span className="truncate">{item.vc_user?.firstname} {item.vc_user?.lastname}</span>
                            </div>
                          </div>
                        </div>
                        {item.vc_car_master?.car_number && (
                          <Link href={`/returns?search=${encodeURIComponent(item.vc_car_master.car_number)}`} className="text-sm font-black text-white bg-red-500 hover:bg-red-600 px-5 py-2.5 rounded-xl transition-colors shrink-0 shadow-sm flex items-center gap-2">
                            ติดตาม <ArrowRight size={16} />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 min-h-[200px]">
                    <CheckCircle size={48} className="text-emerald-400 opacity-80" />
                    <span className="text-base font-bold text-slate-500">ยอดเยี่ยม! ไม่มีรถเกินกำหนดคืน</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Maintenance Causes (Span 5) */}
          <div className="col-span-12 xl:col-span-5">
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 h-full flex flex-col">
              <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center tracking-tight">
                <Wrench className="mr-3 text-indigo-500" size={22} strokeWidth={2.5} />
                สถิติสาเหตุการซ่อมบำรุง
              </h3>
              <div className="space-y-6 flex-1 flex flex-col justify-start">
                {mainCausesStats.length > 0 ? mainCausesStats.map((cause, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-end text-sm font-bold mb-2.5">
                      <span className="text-slate-700 truncate pr-4">{cause.name}</span>
                      <span className="text-slate-800 shrink-0 bg-slate-50 px-2.5 py-1 border border-slate-100 rounded-lg">{cause.count} <span className="text-xs text-slate-400 font-medium">({cause.pct})</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className={`${cause.color} h-full rounded-full opacity-90`} style={{ width: cause.pct }}></div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-sm text-slate-400 py-4 font-medium">ไม่พบข้อมูลการแจ้งซ่อม</div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
