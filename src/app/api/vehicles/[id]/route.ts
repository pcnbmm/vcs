import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const body = await req.json();

    const updatedVehicle = await prisma.vc_car_master.update({
      where: { car_id: parseInt(id) },
      data: {
        car_number: body.car_number !== undefined ? body.car_number : undefined,
        car_brand_id: body.car_brand_id ? parseInt(body.car_brand_id.toString()) : null,
        color_id: body.color_id ? parseInt(body.color_id.toString()) : null,
        car_status_id: body.car_status_id ? parseInt(body.car_status_id.toString()) : null,
        car_province_id: body.car_province_id ? parseInt(body.car_province_id.toString()) : null,
        car_type_id: body.car_type_id ? parseInt(body.car_type_id.toString()) : null,
        car_spec_id: body.car_spec_id ? parseInt(body.car_spec_id.toString()) : null,
        car_type_regis_id: body.car_type_regis_id ? parseInt(body.car_type_regis_id.toString()) : null,
        oil_type_id: body.oil_type_id ? parseInt(body.oil_type_id.toString()) : null,
        regis_date: body.regis_date !== undefined ? body.regis_date : undefined,
        fleetcard_no: body.fleetcard_no !== undefined ? body.fleetcard_no : undefined,
        body_no: body.body_no !== undefined ? body.body_no : undefined,
        machine_no: body.machine_no !== undefined ? body.machine_no : undefined,
        cylinder_capacityp: body.cylinder_capacityp !== undefined ? body.cylinder_capacityp : undefined,
        horse_power: body.horse_power !== undefined ? body.horse_power : undefined,
        weight: body.weight !== undefined ? body.weight : undefined,
        own_div_code: body.own_div_code !== undefined ? body.own_div_code : undefined,
        fiscal_year: body.fiscal_year ? parseInt(body.fiscal_year.toString()) : null,
        start_date: body.start_date !== undefined ? body.start_date : undefined,
        end_date: body.end_date !== undefined ? body.end_date : undefined,
        oil_expense: body.oil_expense ? parseFloat(body.oil_expense.toString()) : null,
        refund_vat: body.refund_vat ? parseInt(body.refund_vat.toString()) : null,
        flag: body.flag !== undefined ? body.flag : undefined,
        ref_car: body.ref_car !== undefined ? body.ref_car : undefined,
        machine_id: body.machine_id !== undefined ? body.machine_id : undefined,
        upd_date: new Date().toISOString(),
      }
    });

    return NextResponse.json(updatedVehicle);
  } catch (error) {
    console.error("Failed to update vehicle:", error);
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    await prisma.vc_car_master.delete({
      where: { car_id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete vehicle:", error);
    return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 });
  }
}
