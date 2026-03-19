import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const drivers = await prisma.vc_driver.findMany({
      include: {
        vc_users: {
          select: {
            userid: true,
            bname: true,
            firstname: true,
            lastname: true,
            mobile_no: true,
          }
        },
        vc_driver_license_type: true,
      },
      orderBy: {
        driver_id: 'asc'
      }
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("Failed to fetch drivers:", error);
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // driver_code maps to userid in vc_users
    // checking if driver_code already exists
    if (body.driver_code) {
      const existing = await prisma.vc_driver.findUnique({
        where: { driver_code: parseInt(body.driver_code.toString()) }
      });
      if (existing) {
        return NextResponse.json({ error: "ผู้ใช้นี้เป็นคนขับอยู่แล้ว" }, { status: 400 });
      }
    }

    const newDriver = await prisma.vc_driver.create({
      data: {
        driver_code: body.driver_code ? parseInt(body.driver_code.toString()) : null,
        driver_status: body.driver_status || 'Y',
        licence_type: body.licence_type ? parseInt(body.licence_type.toString()) : null,
        licence_no: body.licence_no || null,
        tel: body.tel || null,
        cre_by: 'system',
        cre_date: new Date(),
      }
    });
    
    return NextResponse.json(newDriver, { status: 201 });
  } catch (error) {
    console.error("Failed to create driver:", error);
    return NextResponse.json({ error: "Failed to create driver" }, { status: 500 });
  }
}
