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

    // Build sections dropdown: fetch all active orgs (status != 'E') then
    // identify sections by finding orgs that have no children (leaf nodes)
    // or are referenced as sectionid in vc_users. Build formatted label.
    const allActiveOrgs = await prisma.vc_orgs.findMany({
      where: {
        NOT: { status: "E" },
      },
      select: { orgid: true, orgname: true, mom_org: true, status: true },
    });

    // Build a set of orgids that appear as mom_org (i.e., they have children)
    const parentOrgIds = new Set(allActiveOrgs.map((o) => o.mom_org).filter(Boolean));

    // Sections = active orgs that have no children (leaf nodes)
    const sectionOrgs = allActiveOrgs.filter((o) => !parentOrgIds.has(o.orgid));

    // Build a lookup map for all orgs (including non-active) to resolve parent names
    const allOrgsMap = new Map(orgs.map((o: any) => [o.orgid, o]));

    // For each section, find its parent and build the display label
    const sections = sectionOrgs
      .map((section) => {
        const parent = section.mom_org ? allOrgsMap.get(section.mom_org) : null;
        const parentName = parent ? (parent as any).orgname : null;
        const label = parentName
          ? `${parentName} - ${section.orgname}`
          : section.orgname || section.orgid;
        return {
          orgid: section.orgid,
          orgname: section.orgname,
          parent_orgname: parentName,
          display_label: label,
        };
      })
      .sort((a, b) => (a.display_label ?? "").localeCompare(b.display_label ?? "", "th"));

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
