import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.vc_users.findMany({
      select: { userid: true, bname: true, firstname: true, lastname: true },
      orderBy: { firstname: "asc" },
    });

    const notDeleted = { OR: [{ flag_del: { not: "Y" } }, { flag_del: null }] };

    const licenseTypes = await prisma.vc_driver_license_type.findMany({
      where: notDeleted,
    });
    const carBrands = await prisma.vc_car_brand.findMany({ where: notDeleted });
    const colors = await prisma.vc_color.findMany({ where: notDeleted });
    const statuses = await prisma.vc_car_status.findMany({ where: notDeleted });

    // New options
    const provinces = await prisma.vc_province.findMany({
      where: notDeleted,
      orderBy: { province_name: "asc" },
    });
    const carTypes = await prisma.vc_car_type.findMany({ where: notDeleted });
    const carSpecs = await prisma.vc_car_spec.findMany({ where: notDeleted });
    const typeRegis = await prisma.vc_type_regis.findMany({
      where: notDeleted,
    });
    const oilTypes = await prisma.vc_oil_type.findMany({ where: notDeleted });
    const orgs = await prisma.vc_orgs.findMany({ orderBy: { orgname: "asc" } });

    return NextResponse.json({
      users,
      licenseTypes,
      carBrands,
      colors,
      statuses,
      provinces,
      carTypes,
      carSpecs,
      typeRegis,
      oilTypes,
      orgs,
    });
  } catch (error) {
    console.error("Failed to fetch options:", error);
    return NextResponse.json(
      { error: "Failed to fetch options" },
      { status: 500 },
    );
  }
}
