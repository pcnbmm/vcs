import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const menuRoles = await prisma.vc_menu_role.findMany({
      include: {
        vc_roles: true,
        vc_menu: true,
        vc_function: true,
      },
      orderBy: { menu_roles_id: "desc" },
    });

    // Group by roles_id -> menus -> multiple functions
    const rolesMap = new Map();

    menuRoles.forEach((mr) => {
      if (!mr.roles_id) return;

      if (!rolesMap.has(mr.roles_id)) {
        rolesMap.set(mr.roles_id, {
          roles_id: mr.roles_id,
          roles_name: mr.vc_roles?.roles_name,
          menusMap: new Map(), // menu_id -> { menu details, functions: [] }
        });
      }

      const roleObj = rolesMap.get(mr.roles_id);

      if (mr.menu_id && mr.vc_menu) {
        if (!roleObj.menusMap.has(mr.menu_id)) {
          roleObj.menusMap.set(mr.menu_id, {
            menu_id: mr.menu_id,
            menuname: mr.vc_menu.menuname,
            functions: [],
          });
        }

        const menuObj = roleObj.menusMap.get(mr.menu_id);
        // Add function if exists, otherwise it's just a general menu access (null function)
        if (mr.function_id && mr.vc_function) {
          menuObj.functions.push({
            function_id: mr.function_id,
            func_name: mr.vc_function.func_name,
          });
        } else if (!mr.function_id) {
          menuObj.has_general_access = true;
        }
      }
    });

    // Convert inner maps to arrays
    const result = Array.from(rolesMap.values()).map((r) => ({
      ...r,
      menus: Array.from(r.menusMap.values()),
      menusMap: undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching menu-roles:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // data: { roles_id: number, mappings: { menu_id: number, function_id: number | null }[], cre_by: string }
    const rolesId = parseInt(data.roles_id);
    const mappings = data.mappings || [];

    if (isNaN(rolesId)) {
      return NextResponse.json({ error: "Invalid roles_id" }, { status: 400 });
    }

    // 1. Delete existing mappings for this role
    await prisma.vc_menu_role.deleteMany({
      where: { roles_id: rolesId },
    });

    // 2. Insert new mappings
    if (mappings.length > 0) {
      const newRecords = mappings.map((m: any) => ({
        roles_id: rolesId,
        menu_id: parseInt(m.menu_id),
        function_id: m.function_id ? parseInt(m.function_id) : null,
        cre_by: data.cre_by ? parseInt(data.cre_by) : null,
        cre_date: new Date(),
        upd_by: data.cre_by ? parseInt(data.cre_by) : null,
        upd_date: new Date(),
      }));

      await prisma.vc_menu_role.createMany({
        data: newRecords,
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating menu-roles:", error);
    return NextResponse.json(
      { error: "Failed to assign menus to role", details: error.message },
      { status: 500 },
    );
  }
}
