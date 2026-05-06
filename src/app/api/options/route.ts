import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.vc_users.findMany({
      select: { userid: true, bname: true, firstname: true, lastname: true, sectionid: true, },
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

    // Build sections dropdown:
    // 1. Get distinct own_div_code from vc_own_div_prop (not deleted)
    // 2. For each code, look up org in vc_orgs where status != 'E'
    // 3. Resolve parent (mom_org) to build formatted label "ฝ่าย - ส่วน" / "กลุ่ม - ส่วน"

    // Build a full orgs lookup map (orgid -> org) for resolving parent names
    const allOrgsMap = new Map(orgs.map((o: any) => [o.orgid, o]));

    // Get distinct own_div_code entries from vc_own_div_prop (not deleted)
    const ownDivProps = await prisma.vc_own_div_prop.findMany({
      where: {
        OR: [{ flag_del: { not: "Y" } }, { flag_del: null }],
        own_div_code: { not: null },
      },
      select: { own_div_code: true },
      distinct: ["own_div_code"],
    });

    const uniqueCodes = ownDivProps
      .map((p) => p.own_div_code)
      .filter(Boolean) as string[];

    // For each code, find the org in vc_orgs (status != 'E'), then get parent
    const sections = uniqueCodes
      .map((code) => {
        const org = allOrgsMap.get(code) as any | undefined;
        if (!org) return null;
        // Skip orgs with status 'E'
        if (org.status === "E") return null;

        const parent = org.mom_org ? allOrgsMap.get(org.mom_org) : null;
        const parentName = parent ? (parent as any).orgname : null;
        const label = parentName
          ? `${parentName} - ${org.orgname}`
          : org.orgname || code;

        return {
          orgid: org.orgid,
          orgname: org.orgname,
          parent_orgname: parentName,
          display_label: label,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) =>
        (a.display_label ?? "").localeCompare(b.display_label ?? "", "th")
      );


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
      sections,
    });
  } catch (error) {
    console.error("Failed to fetch options:", error);
    return NextResponse.json(
      { error: "Failed to fetch options" },
      { status: 500 },
    );
  }
}
