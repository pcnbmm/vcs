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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newVehicle = await prisma.vc_car_master.create({
      data: {
        car_number: body.car_number || null,
        car_brand_id: body.car_brand_id ? parseInt(body.car_brand_id.toString()) : null,
        color_id: body.color_id ? parseInt(body.color_id.toString()) : null,
        car_status_id: body.car_status_id ? parseInt(body.car_status_id.toString()) : null,
        regis_date: body.regis_date || null,
        fleetcard_no: body.fleetcard_no || null,
        body_no: body.body_no || null,
        machine_no: body.machine_no || null,
        cylinder_capacityp: body.cylinder_capacityp || null,
        horse_power: body.horse_power || null,
        weight: body.weight || null,
        cre_date: new Date().toISOString(),
      }
    });

    return NextResponse.json(newVehicle, { status: 201 });
  } catch (error) {
    console.error("Failed to create vehicle:", error);
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
  }
}
