import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();

    if (body.driver_code) {
        const existing = await prisma.vc_driver.findFirst({
            where: { 
                driver_code: parseInt(body.driver_code.toString()),
                driver_id: { not: id }
            }
        });
        if (existing) {
            return NextResponse.json({ error: "รหัสคนขับนี้มีในระบบแล้ว" }, { status: 400 });
        }
    }

    const updatedDriver = await prisma.vc_driver.update({
      where: { driver_id: id },
      data: {
        driver_code: body.driver_code !== undefined ? (body.driver_code ? parseInt(body.driver_code.toString()) : null) : undefined,
        driver_status: body.driver_status !== undefined ? body.driver_status : undefined,
        licence_type: body.licence_type !== undefined ? (body.licence_type ? parseInt(body.licence_type.toString()) : null) : undefined,
        licence_no: body.licence_no !== undefined ? body.licence_no : undefined,
        tel: body.tel !== undefined ? body.tel : undefined,
        upd_date: new Date(),
      }
    });

    return NextResponse.json(updatedDriver);
  } catch (error) {
    console.error("Failed to update driver:", error);
    return NextResponse.json({ error: "Failed to update driver" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    await prisma.vc_driver.delete({
      where: { driver_id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete driver:", error);
    return NextResponse.json({ error: "Failed to delete driver - might be in use" }, { status: 500 });
  }
}
