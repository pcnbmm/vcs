import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.vc_roles.findMany({
      orderBy: { roles_id: "desc" },
    });
    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const newRole = await prisma.vc_roles.create({
      data: {
        roles_name: data.roles_name,
        description: data.description,
        cre_by: data.cre_by || "system",
        cre_date: new Date(),
        upd_by: data.cre_by || "system",
        upd_date: new Date(),
      },
    });

    return NextResponse.json(newRole, { status: 201 });
  } catch (error: any) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Failed to create role", details: error.message },
      { status: 500 },
    );
  }
}
