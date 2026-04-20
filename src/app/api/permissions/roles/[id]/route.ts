import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const data = await request.json();

    const updatedRole = await prisma.vc_roles.update({
      where: { roles_id: id },
      data: {
        roles_name: data.roles_name,
        description: data.description,
        upd_by: data.upd_by || "system",
        upd_date: new Date(),
      },
    });

    return NextResponse.json(updatedRole);
  } catch (error: any) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.vc_roles.delete({
      where: { roles_id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Failed to delete role", details: error.message },
      { status: 500 },
    );
  }
}
