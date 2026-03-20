"use server";

import { prisma } from "@/lib/prisma";

export async function getMenusByRoleIds(roleIds: number[]) {
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
            functions: (mr.function_id && mr.vc_function) ? [mr.vc_function.func_name] : []
          });
        } else {
          // ถ้ามีเมนูนี้อยู่แล้ว ให้เพิ่มชื่อฟังก์ชันเข้าไปในอาเรย์
          const existing = menuMap.get(mr.menu_id);
          if (mr.function_id && mr.vc_function && !existing.functions.includes(mr.vc_function.func_name)) {
            existing.functions.push(mr.vc_function.func_name);
          }
        }
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
