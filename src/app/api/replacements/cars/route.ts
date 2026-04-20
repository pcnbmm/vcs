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
        vc_rent_car: {
          some: {}, // Only fetch if they have a rental car record
        },
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
