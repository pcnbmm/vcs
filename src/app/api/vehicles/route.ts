import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const vehicles = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT ON (m.car_id) 
        m.*, 
        b.car_brand_name, 
        b.car_series_name,
        c.color_name,
        s.car_status_name
      FROM vc_car_master m 
      LEFT JOIN vc_car_brand b ON m.car_brand_id = b.car_brand_id 
      LEFT JOIN vc_color c ON m.color_id = c.color_id
      LEFT JOIN vc_car_status s ON m.car_status_id = s.car_status_id
      ORDER BY m.car_id ASC
    `;

    const sanitizedVehicles = vehicles.map((v: any) => ({
      ...v,
      fleetcard_no: v.fleetcard_no ? v.fleetcard_no.toString() : null,
    }));

    return NextResponse.json(sanitizedVehicles);
  } catch (error) {
    console.error("Failed to fetch vehicles:", error);
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
  }
}
