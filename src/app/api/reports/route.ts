import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const period = searchParams.get("period");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let dateFilter: any = undefined;
  if (period === "monthly" && month && year) {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 1);
    dateFilter = { gte: startDate, lt: endDate };
  } else if (period === "yearly" && year) {
    const startDate = new Date(parseInt(year), 0, 1);
    const endDate = new Date(parseInt(year) + 1, 0, 1);
    dateFilter = { gte: startDate, lt: endDate };
  }

  try {
    switch (type) {
      case "summary_performance": {
        const users = await prisma.vc_users.findMany({
          take: 50,
          include: {
            _count: {
              select: { 
                vc_order_item: dateFilter ? { where: { cre_date: dateFilter } } : true
              },
            },
          },
        });
        const data = users.map((u) => ({
          name: `${u.firstname || ""} ${u.lastname || ""}`.trim() || u.username,
          position: u.positionname || "-",
          tasks: u._count.vc_order_item,
          distance: "-", // No distance field in schema yet
        }));
        return NextResponse.json({ success: true, data });
      }

      case "fueling": {
        const fuels = await prisma.vc_fuel_item.findMany({
          where: dateFilter ? { fuel_date: dateFilter } : undefined,
          take: 50,
          include: {
            vc_oil_type: true,
            // but car_id is there. Let's see if we can join manually or use relation if I missed it.
          },
          orderBy: { fuel_date: "desc" },
        });

        // Fetch car numbers for these car_ids
        const carIds = fuels
          .map((f) => f.car_id)
          .filter((id) => id !== null) as number[];
        const cars = await prisma.vc_car_master.findMany({
          where: { car_id: { in: carIds } },
        });
        const carMap = new Map(cars.map((c) => [c.car_id, c.car_number]));

        const data = fuels.map((f) => ({
          date: f.fuel_date?.toISOString().split("T")[0] || "-",
          car_no: f.car_id ? carMap.get(f.car_id) || "-" : "-",
          fuel_type: f.vc_oil_type?.oil_type_name || "-",
          liters: f.amount_liter?.toString() || "0",
          amount: f.amount_baht?.toString() || "0",
        }));
        return NextResponse.json({ success: true, data });
      }

      case "summary_status": {
        const statusId = searchParams.get("statusId");
        const where: any = {};
        if (statusId && statusId !== "all") {
          where.status_use_id = parseInt(statusId);
        }
        if (dateFilter) {
          where.cre_date = dateFilter;
        }

        const orders = await prisma.vc_order_item.findMany({
          where,
          take: 100,
          include: {
            vc_status_use_code: true,
            vc_user: true,
          },
          orderBy: { cre_date: "desc" },
        });
        const data = orders.map((o) => ({
          id: o.request_id,
          detail: o.journey_place || "-",
          date: o.journey_date?.toISOString().split("T")[0] || "-",
          status: o.vc_status_use_code?.status_use_name || "N/A",
        }));
        return NextResponse.json({ success: true, data });
      }

      case "replacement_usage": {
        const replacements = await prisma.vc_replacement.findMany({
          where: dateFilter ? { cre_date: dateFilter } : undefined,
          orderBy: { cre_date: "desc" },
          take: 100,
        });

        const data = replacements.map((r) => ({
          broken_car: r.broken_car_id || "-",
          replacement_car: r.car_number || "-",
          start_date: r.start_datetime || "-",
          end_date: r.end_datetime || "-",
          cre_by: r.cre_by || "-",
          status: r.end_datetime ? "คืนแล้ว" : r.car_id ? "กำลังใช้งาน" : "รอระบุรถที่เสีย",
        }));
        return NextResponse.json({ success: true, data });
      }

      case "maintenance_incident": {
        const incidents = await prisma.vc_maintenance_item.findMany({
          where: dateFilter ? { incident_date: dateFilter } : undefined,
          orderBy: { incident_date: "desc" },
          take: 100,
          include: {
            vc_car_master: {
              include: { vc_car_brand: true }
            },
            vc_maintenance_cause: true,
          },
        });

        const data = incidents.map((i) => ({
          car_desc: i.vc_car_master?.vc_car_brand?.car_brand_name || "-",
          car_no: i.vc_car_master?.car_number || "-",
          cause: i.vc_maintenance_cause?.cause_detail || "-",
          date: i.incident_date ? i.incident_date.toLocaleDateString('th-TH') : "-",
          time: i.incident_time || "-",
        }));
        return NextResponse.json({ success: true, data });
      }

      case "regional_booking": {
        const where: any = { is_regional_booking: true };
        if (dateFilter) {
          where.cre_date = dateFilter;
        }

        const orders = await prisma.vc_order_item.findMany({
          where,
          take: 100,
          include: {
            vc_status_use_code: true,
            vc_user: {
              include: {
                department_id: true
              }
            },
          },
          orderBy: { cre_date: "desc" },
        });
        
        const data = orders.map((o) => ({
          id: o.request_id,
          department: o.vc_user?.department_id?.orgname || "-",
          origin: o.journey_origin_text || "-",
          detail: o.journey_place || "-",
          date: o.journey_date?.toISOString().split("T")[0] || "-",
          status: o.vc_status_use_code?.status_use_name || "N/A",
        }));
        return NextResponse.json({ success: true, data });
      }

      case "central_booking": {
        const where: any = { is_regional_booking: false };
        if (dateFilter) {
          where.cre_date = dateFilter;
        }

        const orders = await prisma.vc_order_item.findMany({
          where,
          take: 100,
          include: {
            vc_status_use_code: true,
            vc_user: {
              include: {
                department_id: true
              }
            },
          },
          orderBy: { cre_date: "desc" },
        });
        
        const data = orders.map((o) => ({
          id: o.request_id,
          department: o.vc_user?.department_id?.orgname || "-",
          detail: o.journey_place || "-",
          date: o.journey_date?.toISOString().split("T")[0] || "-",
          status: o.vc_status_use_code?.status_use_name || "N/A",
        }));
        return NextResponse.json({ success: true, data });
      }

      case "journey_causes": {
        const where: any = {};
        if (dateFilter) {
          where.cre_date = dateFilter;
        }

        const reasonsRaw = await prisma.vc_order_item.groupBy({
          by: ['journey_causes'],
          where,
          _count: true,
          orderBy: { _count: { journey_causes: 'desc' } },
        });

        const data = reasonsRaw.map((r, index) => ({
          id: index + 1,
          cause: r.journey_causes || "ไม่ระบุเหตุผล / ว่าง",
          count: r._count,
        }));
        return NextResponse.json({ success: true, data });
      }

      default:
        return NextResponse.json({
          success: false,
          message: "Unknown report type",
          data: [],
        });
    }
  } catch (error: any) {
    console.error("Report API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message, data: [] },
      { status: 500 },
    );
  }
}
