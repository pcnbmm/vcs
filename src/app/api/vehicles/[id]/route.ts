import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();

    const updatedVehicle = await prisma.vc_car_master.update({
      where: { car_id: id },
      data: {
        car_number: body.car_number !== undefined ? body.car_number : undefined,
        car_brand_id: body.car_brand_id !== undefined ? (body.car_brand_id ? parseInt(body.car_brand_id.toString()) : null) : undefined,
        color_id: body.color_id !== undefined ? (body.color_id ? parseInt(body.color_id.toString()) : null) : undefined,
        car_status_id: body.car_status_id !== undefined ? (body.car_status_id ? parseInt(body.car_status_id.toString()) : null) : undefined,
        regis_date: body.regis_date !== undefined ? body.regis_date : undefined,
        fleetcard_no: body.fleetcard_no !== undefined ? body.fleetcard_no : undefined,
        body_no: body.body_no !== undefined ? body.body_no : undefined,
        machine_no: body.machine_no !== undefined ? body.machine_no : undefined,
        cylinder_capacityp: body.cylinder_capacityp !== undefined ? body.cylinder_capacityp : undefined,
        horse_power: body.horse_power !== undefined ? body.horse_power : undefined,
        weight: body.weight !== undefined ? body.weight : undefined,
        upd_date: new Date().toISOString(),
      }
    });

    return NextResponse.json(updatedVehicle);
  } catch (error) {
    console.error("Failed to update vehicle:", error);
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    await prisma.vc_car_master.delete({
      where: { car_id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete vehicle:", error);
    return NextResponse.json({ error: "Failed to delete vehicle - might be in use" }, { status: 500 });
  }
}
