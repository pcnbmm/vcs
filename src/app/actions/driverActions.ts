"use server";

import { prisma } from "@/lib/prisma";

export async function getDrivers() {
  try {
    const drivers = await prisma.vc_driver.findMany({
      where: {
        OR: [{ flag: null }, { flag: { not: "X" } }],
      },
      include: {
        vc_users: {
          select: {
            userid: true,
            firstname: true,
            lastname: true,
            bname: true,
            sectionid: true,
          },
        },
      },
      orderBy: { driver_id: "asc" },
    });
    return { success: true, data: drivers };
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return { success: false, data: [] };
  }
}
