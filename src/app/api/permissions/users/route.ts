import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.vc_users.findMany({
      select: {
        userid: true,
        username: true,
        firstname: true,
        lastname: true,
        positionname: true,
      },
      orderBy: { firstname: "asc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
