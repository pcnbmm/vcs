import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch active cars that are NOT currently replaced
    // We can check if there's an active replacement
    const activeReplacements = await prisma.vc_replacement.findMany({
      where: {
        end_datetime: null,
      },
      select: { car_id: true },
    });

    const replacedCarIds = activeReplacements
      .map((r) => r.car_id)
      .filter((id) => id !== null);

    // Fetch all cars that are rental cars AND not currently replaced
    const availableCars = await prisma.vc_car_master.findMany({
      where: {
        car_id: { notIn: replacedCarIds as number[] },

        vc_car_type: {
          car_type_name: {
            in: ["รถเช่า NT", "รถเช่า NT1", "รถเช่า NT2"],
          },
        },
        vc_car_status: {
          car_status_name: {
            contains: "ใช้งานอยู่",
          },
        },
      },
      orderBy: {
        car_number: "asc",
      },
    });

    return NextResponse.json(availableCars);
  } catch (error) {
    console.error("Error fetching available cars", error);
    return NextResponse.json(
      { error: "Failed to fetch cars" },
      { status: 500 },
    );
  }
}
