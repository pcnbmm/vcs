"use server";

import { prisma } from "@/lib/prisma";

export async function getMenusByRoleIds(roleIds: number[], sectionId?: string) {
  try {
    const menuRoles = await prisma.vc_menu_role.findMany({
      where: { roles_id: { in: roleIds } },
      include: {
        vc_menu: true,
        vc_function: true,
      },
    });

    // ดึง menu ที่ไม่ซ้ำกัน พร้อมฟังก์ชันทั้งหมดของเมนูนั้นๆ
    const menuMap = new Map<number, any>();
    for (const mr of menuRoles) {
      if (mr.vc_menu && mr.menu_id) {
        if (!menuMap.has(mr.menu_id)) {
          // เก็บข้อมูลเมนูครั้งแรก พร้อมอาเรย์ functions คอยเก็บชื่อฟังก์ชัน
          menuMap.set(mr.menu_id, {
            ...mr.vc_menu,
            functions:
              mr.function_id && mr.vc_function
                ? [mr.vc_function.func_name]
                : [],
          });
        } else {
          // ถ้ามีเมนูนี้อยู่แล้ว ให้เพิ่มชื่อฟังก์ชันเข้าไปในอาเรย์
          const existing = menuMap.get(mr.menu_id);
          if (
            mr.function_id &&
            mr.vc_function &&
            !existing.functions.includes(mr.vc_function.func_name)
          ) {
            existing.functions.push(mr.vc_function.func_name);
          }
        }
      }
    }

    // --- กรองเมนู "ขอใช้รถส่วนภูมิภาค" ตามสิทธิ์ในตาราง vc_own_div_prop ---
    const regionalMenuEntry = Array.from(menuMap.entries()).find(
      ([_, m]) => m.menuname === "ขอใช้รถส่วนภูมิภาค"
    );

    if (regionalMenuEntry && sectionId) {
      const [menuId] = regionalMenuEntry;
      const isAuthorized = await prisma.vc_own_div_prop.findFirst({
        where: {
          own_div_code: sectionId,
          OR: [{ flag_del: "N" }, { flag_del: null }],
        },
      });

      if (!isAuthorized) {
        menuMap.delete(menuId);
      }
    } else if (regionalMenuEntry && !sectionId) {
      // ถ้าไม่มี sectionId และไม่ใช่ Admin (สมมติ Role 1 คือ Admin หรือมี Role อื่นที่ข้ามได้)
      // แต่ในที่นี้ถ้าไม่มี sectionId ให้ซ่อนไว้ก่อนเพื่อความปลอดภัย
      const [menuId] = regionalMenuEntry;
      if (!roleIds.includes(1)) { // ถ้าไม่ใช่ Admin (Role 1)
         menuMap.delete(menuId);
      }
    }
    // -------------------------------------------------------------

    return {
      success: true,
      data: Array.from(menuMap.values()),
    };
  } catch (error) {
    console.error("Error fetching menus:", error);
    return { success: false, data: [] };
  }
}
