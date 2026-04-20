import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userRoles = await prisma.vc_user_roles.findMany({
      include: {
        vc_users: true,
        vc_roles: true,
      },
      orderBy: { user_roles_id: "desc" },
    });

    // Group by user_id
    const usersMap = new Map();

    userRoles.forEach((ur) => {
      if (!ur.user_id) return;

      if (!usersMap.has(ur.user_id)) {
        usersMap.set(ur.user_id, {
          user_id: ur.user_id,
          username: ur.vc_users?.username,
          fullname:
            `${ur.vc_users?.firstname || ""} ${ur.vc_users?.lastname || ""}`.trim(),
          roles: [],
        });
      }

      if (ur.roles_id && ur.vc_roles) {
        usersMap.get(ur.user_id).roles.push({
          user_roles_id: ur.user_roles_id,
          roles_id: ur.roles_id,
          roles_name: ur.vc_roles.roles_name,
        });
      }
    });

    return NextResponse.json(Array.from(usersMap.values()));
  } catch (error) {
    console.error("Error fetching user-roles:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // data: { user_id: number, roles_ids: number[], cre_by: string }
    const userId = parseInt(data.user_id);
    const rolesIds = data.roles_ids || [];

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user_id" }, { status: 400 });
    }

    // 1. Delete existing roles for this user
    await prisma.vc_user_roles.deleteMany({
      where: { user_id: userId },
    });

    // 2. Insert new roles
    if (rolesIds.length > 0) {
      const newRecords = rolesIds.map((rid: string | number) => ({
        user_id: userId,
        roles_id: parseInt(rid.toString()),
        cre_by: data.cre_by || "system",
        cre_date: new Date(),
        upd_by: data.cre_by || "system",
        upd_date: new Date(),
      }));

      await prisma.vc_user_roles.createMany({
        data: newRecords,
      });
    }

    // 3. Update vc_users.user_role_id with the first role (legacy support)
    await prisma.vc_users.update({
      where: { userid: userId },
      data: {
        user_role_id: rolesIds.length > 0 ? parseInt(rolesIds[0]) : null,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user-roles:", error);
    return NextResponse.json(
      { error: "Failed to assign roles to user", details: error.message },
      { status: 500 },
    );
  }
}
