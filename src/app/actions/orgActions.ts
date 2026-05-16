"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getMyOrgs() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, data: [] };

    const userId = parseInt(session.user.id);
    const user = await prisma.vc_users.findUnique({
      where: { userid: userId },
    });

    const orgIds = user
      ? ([user.sectionid].filter((id) => id != null) as string[])
      : [];

    const orgs = await prisma.vc_orgs.findMany({
      where: {
        status: "X",
        OR: [
          ...(orgIds.length > 0 ? [{ orgid: { in: orgIds } }] : []),
          { orgname: { contains: "ยานพาหนะ" } },
        ],
      },
      orderBy: { orgid: "asc" },
    });
    return { success: true, data: orgs };
  } catch (error) {
    console.error("Error fetching my orgs:", error);
    return { success: false, data: [] };
  }
}

/**
 * ใช้กับหน้า bookinglocal เท่านั้น
 * ตรวจสอบว่า user มี sectionid ที่อยู่ใน vc_own_div_prop หรือไม่
 * ถ้ามี → return org ของ section นั้น
 * ถ้าไม่มี → return null (ไม่มีสิทธิ์เข้าหน้า bookinglocal)
 */
export async function getMyLocalBookingSection() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { authorized: false, org: null };

    const userId = parseInt(session.user.id);
    const user = await prisma.vc_users.findUnique({
      where: { userid: userId },
    });

    if (!user?.sectionid) return { authorized: false, org: null };

    // เช็คว่า sectionid ของ user มีอยู่ใน vc_own_div_prop
    const ownDivProp = await prisma.vc_own_div_prop.findFirst({
      where: {
        own_div_code: user.sectionid,
        OR: [{ flag_del: "N" }, { flag_del: null }],
      },
    });

    if (!ownDivProp) return { authorized: false, org: null };

    // ดึงข้อมูล org ของ section นั้น
    const org = await prisma.vc_orgs.findFirst({
      where: { orgid: user.sectionid },
    });

    return { authorized: true, org };
  } catch (error) {
    console.error("Error in getMyLocalBookingSection:", error);
    return { authorized: false, org: null };
  }
}

export async function getOrgsByUserId(userId: number) {
  try {
    const user = await prisma.vc_users.findUnique({
      where: { userid: userId },
    });

    const orgIds = user
      ? ([user.sectionid].filter((id) => id != null) as string[])
      : [];

    const orgs = await prisma.vc_orgs.findMany({
      where: {
        status: "X",
        OR: [
          ...(orgIds.length > 0 ? [{ orgid: { in: orgIds } }] : []),
          { orgname: { contains: "ยานพาหนะ" } },
        ],
      },
      orderBy: { orgid: "asc" },
    });

    return { success: true, data: orgs };
  } catch (error) {
    console.error("Error fetching orgs by user:", error);
    return { success: false, data: [] };
  }
}
