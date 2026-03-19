import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.vc_users.findMany({
      select: { userid: true, bname: true, firstname: true, lastname: true },
      orderBy: { firstname: 'asc' }
    });

    const licenseTypes = await prisma.vc_driver_license_type.findMany();
    const carBrands = await prisma.vc_car_brand.findMany();
    const colors = await prisma.vc_color.findMany();
    const statuses = await prisma.vc_car_status.findMany();

    return NextResponse.json({
      users,
      licenseTypes,
      carBrands,
      colors,
      statuses,
    });
  } catch (error) {
    console.error("Failed to fetch options:", error);
    return NextResponse.json({ error: "Failed to fetch options" }, { status: 500 });
  }
}
