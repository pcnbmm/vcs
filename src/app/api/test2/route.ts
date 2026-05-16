import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bookings = await prisma.vc_order_item.findMany({
    select: { request_id: true, use_div_code: true, userid: true, status_use_id: true },
    orderBy: { request_id: "desc" },
    take: 10,
  });

  return NextResponse.json({
    bookings,
  });
}
