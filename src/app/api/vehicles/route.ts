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
        s.car_status_name,
        p.province_name,
        ct.car_type_name,
        cs.car_spec_name,
        tr.type_regis_name,
        ot.oil_type_name
      FROM vc_car_master m 
      LEFT JOIN vc_car_brand b ON m.car_brand_id = b.car_brand_id 
      LEFT JOIN vc_color c ON m.color_id = c.color_id
      LEFT JOIN vc_car_status s ON m.car_status_id = s.car_status_id
      LEFT JOIN vc_province p ON m.car_province_id = p.province_id
      LEFT JOIN vc_car_type ct ON m.car_type_id = ct.car_type_id
      LEFT JOIN vc_car_spec cs ON m.car_spec_id = cs.car_spec_id
      LEFT JOIN vc_type_regis tr ON m.car_type_regis_id = tr.type_regis_id
      LEFT JOIN vc_oil_type ot ON m.oil_type_id = ot.oil_type_id
      ORDER BY m.car_id ASC
    `;

    const sanitizedVehicles = vehicles.map((v: any) => ({
      ...v,
      fleetcard_no: v.fleetcard_no ? v.fleetcard_no.toString() : null,
      car_brand_id: v.car_brand_id !== null ? v.car_brand_id : "",
      color_id: v.color_id !== null ? v.color_id : "",
      car_status_id: v.car_status_id !== null ? v.car_status_id : "",
      car_province_id: v.car_province_id !== null ? v.car_province_id : "",
      car_type_id: v.car_type_id !== null ? v.car_type_id : "",
      car_spec_id: v.car_spec_id !== null ? v.car_spec_id : "",
      car_type_regis_id:
        v.car_type_regis_id !== null ? v.car_type_regis_id : "",
      oil_type_id: v.oil_type_id !== null ? v.oil_type_id : "",
    }));

    return NextResponse.json(sanitizedVehicles);
  } catch (error) {
    console.error("Failed to fetch vehicles:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newVehicle = await prisma.vc_car_master.create({
      data: {
        car_number: body.car_number || null,
        car_brand_id: body.car_brand_id
          ? parseInt(body.car_brand_id.toString())
          : null,
        color_id: body.color_id ? parseInt(body.color_id.toString()) : null,
        car_status_id: body.car_status_id
          ? parseInt(body.car_status_id.toString())
          : null,

        car_province_id: body.car_province_id
          ? parseInt(body.car_province_id.toString())
          : null,
        car_type_id: body.car_type_id
          ? parseInt(body.car_type_id.toString())
          : null,
        car_spec_id: body.car_spec_id
          ? parseInt(body.car_spec_id.toString())
          : null,
        car_type_regis_id: body.car_type_regis_id
          ? parseInt(body.car_type_regis_id.toString())
          : null,
        oil_type_id: body.oil_type_id
          ? parseInt(body.oil_type_id.toString())
          : null,

        regis_date: body.regis_date || null,
        fleetcard_no: body.fleetcard_no || null,
        body_no: body.body_no || null,
        machine_no: body.machine_no || null,
        cylinder_capacityp: body.cylinder_capacityp || null,
        horse_power: body.horse_power || null,
        weight: body.weight || null,

        own_div_code: body.own_div_code || null,
        fiscal_year: body.fiscal_year
          ? parseInt(body.fiscal_year.toString())
          : null,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        oil_expense: body.oil_expense
          ? parseFloat(body.oil_expense.toString())
          : null,
        refund_vat: body.refund_vat
          ? parseInt(body.refund_vat.toString())
          : null,
        flag: body.flag || null,
        ref_car: body.ref_car || null,
        machine_id: body.machine_id || null,

        cre_date: new Date().toISOString(),
      },
    });

    return NextResponse.json(newVehicle, { status: 201 });
  } catch (error) {
    console.error("Failed to create vehicle:", error);
    return NextResponse.json(
      { error: "Failed to create vehicle" },
      { status: 500 },
    );
  }
}
