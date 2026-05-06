import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const body = await req.json();

    const updatedDriver = await prisma.vc_driver.update({
      where: { driver_id: parseInt(id) },
      data: {
        driver_code: body.driver_code
          ? parseInt(body.driver_code.toString())
          : null,
        driver_status:
          body.driver_status !== undefined ? body.driver_status : undefined,
        driver_type_id: body.driver_type_id !== undefined ? parseInt(body.driver_type_id.toString()) : undefined,
        div_code: body.div_code !== undefined ? body.div_code : undefined,
        start_date: body.start_date ? new Date(body.start_date) : null,
        end_date: body.end_date ? new Date(body.end_date) : null,
        licence_type: body.licence_type
          ? parseInt(body.licence_type.toString())
          : null,
        licence_no: body.licence_no !== undefined ? body.licence_no : undefined,
        licence_by: body.licence_by
          ? parseInt(body.licence_by.toString())
          : null,
        tel: body.tel !== undefined ? body.tel : undefined,
        flag: body.flag !== undefined ? body.flag : undefined,
        upd_date: new Date(),
      },
    });

    return NextResponse.json(updatedDriver);
  } catch (error) {
    console.error("Failed to update driver:", error);
    return NextResponse.json(
      { error: "Failed to update driver" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    await prisma.vc_driver.delete({
      where: { driver_id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete driver:", error);
    return NextResponse.json(
      { error: "Failed to delete driver" },
      { status: 500 },
    );
  }
}
