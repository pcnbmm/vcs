import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  try {
    switch (type) {
      case "summary_performance": {
        const users = await prisma.vc_users.findMany({
          take: 50,
          include: {
            _count: {
              select: { vc_order_item: true },
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
          take: 50,
          include: {
            vc_oil_type: true,
            // vc_fuel_item doesn't have a direct relation to car_master in schema,
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
          orderBy: { cre_date: "desc" },
          take: 100,
        });

        const data = replacements.map((r) => ({
          broken_car: r.broken_car_id || "-",
          replacement_car: r.car_number || "-",
          start_date: r.start_date ? r.start_date.toISOString().split("T")[0] : "-",
          end_date: r.end_date ? r.end_date.toISOString().split("T")[0] : "-",
          cre_by: r.cre_by || "-",
          status: r.end_datetime ? "คืนแล้ว" : r.car_id ? "กำลังใช้งาน" : "รอระบุรถที่เสีย",
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
