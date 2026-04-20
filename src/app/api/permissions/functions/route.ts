import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const functions = await prisma.vc_function.findMany({
      orderBy: { function_id: "desc" },
    });
    return NextResponse.json(functions);
  } catch (error) {
    console.error("Error fetching functions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const newFunc = await prisma.vc_function.create({
      data: {
        func_name: data.func_name,
        cre_by: data.cre_by || "system",
        cre_date: new Date(),
        upd_by: data.cre_by || "system",
        upd_date: new Date(),
      },
    });

    return NextResponse.json(newFunc, { status: 201 });
  } catch (error: any) {
    console.error("Error creating function:", error);
    return NextResponse.json(
      { error: "Failed to create function", details: error.message },
      { status: 500 },
    );
  }
}
