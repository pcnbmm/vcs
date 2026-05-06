import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const replacementCars = await prisma.vc_car_master.findMany({
      where: {
        OR: [
          { vc_car_type: { car_type_name: { contains: "ทดแทน" } } },
          { vc_car_status: { car_status_name: { contains: "ทดแทน" } } }
        ]
      },
      include: {
        vc_car_spec: true,
        vc_province: true,
        vc_replacement: {
          where: { end_datetime: null },
          select: {
            broken_car_id: true,
            start_datetime: true
          }
        }
      }
    });

    return NextResponse.json(replacementCars);
  } catch (error) {
    console.error("Error fetching replacement cars", error);
    return NextResponse.json(
      { error: "Failed to fetch replacement cars" },
      { status: 500 },
    );
  }
}
