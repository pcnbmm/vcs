"use server";

import { prisma } from "@/lib/prisma";

export async function getMenusByRoleIds(roleIds: number[]) {
  try {
    const menuRoles = await prisma.vc_menu_role.findMany({
      where: { roles_id: { in: roleIds } },
      include: {
        vc_menu: true,
      },
    });

    // ดึง menu ที่ไม่ซ้ำกัน
    const menuMap = new Map<number, any>();
    for (const mr of menuRoles) {
      if (mr.vc_menu && mr.menu_id) {
        menuMap.set(mr.menu_id, mr.vc_menu);
      }
    }

    return {
      success: true,
      data: Array.from(menuMap.values()),
    };
  } catch (error) {
    console.error("Error fetching menus:", error);
    return { success: false, data: [] };
  }
}
