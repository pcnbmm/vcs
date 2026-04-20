import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // We will repurpose this to delete ALL roles for a specific user_id
  try {
    const { id: idStr } = await params;
    const userId = parseInt(idStr);
    if (isNaN(userId))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await prisma.vc_user_roles.deleteMany({
      where: { user_id: userId },
    });

    await prisma.vc_users.update({
      where: { userid: userId },
      data: { user_role_id: null },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user-roles:", error);
    return NextResponse.json(
      { error: "Failed to remove user roles", details: error.message },
      { status: 500 },
    );
  }
}
