import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const drivers = await prisma.vc_driver.findMany({
      include: {
        vc_users: {
          select: {
            firstname: true,
            lastname: true,
          },
        },
        vc_driver_license_type: {
          select: {
            license_type_name: true,
          },
        },
      },
      orderBy: {
        driver_id: "asc",
      },
    });

    const sanitizedDrivers = drivers.map((d) => ({
      ...d,
      driver_code: d.driver_code !== null ? d.driver_code : "",
      licence_type: d.licence_type !== null ? d.licence_type : "",
      licence_by: d.licence_by !== null ? d.licence_by : "",
    }));

    return NextResponse.json(sanitizedDrivers);
  } catch (error) {
    console.error("Failed to fetch drivers:", error);
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newDriver = await prisma.vc_driver.create({
      data: {
        driver_code: body.driver_code
          ? parseInt(body.driver_code.toString())
          : null,
        driver_status: body.driver_status || null,
        div_code: body.div_code || null,
        start_date: body.start_date ? new Date(body.start_date) : null,
        end_date: body.end_date ? new Date(body.end_date) : null,
        licence_type: body.licence_type
          ? parseInt(body.licence_type.toString())
          : null,
        licence_no: body.licence_no || null,
        licence_by: body.licence_by
          ? parseInt(body.licence_by.toString())
          : null,
        tel: body.tel || null,
        flag: body.flag || null,
        cre_date: new Date(),
      },
    });

    return NextResponse.json(newDriver, { status: 201 });
  } catch (error) {
    console.error("Failed to create driver:", error);
    return NextResponse.json(
      { error: "Failed to create driver" },
      { status: 500 },
    );
  }
}
