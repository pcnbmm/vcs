import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const replacements = await prisma.vc_replacement.findMany({
      include: {
        vc_car_master: true,
      },
      orderBy: {
        replacement_id: "desc",
      },
    });

    return NextResponse.json(replacements);
  } catch (error) {
    console.error("Error fetching replacements", error);
    return NextResponse.json(
      { error: "Failed to fetch replacements" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user?.name || "system";

    const body = await req.json();
    const { replacement_car_number, car_province_id, car_spec_id, remark } =
      body;

    if (!replacement_car_number) {
      return NextResponse.json(
        { error: "replacement_car_number is required" },
        { status: 400 },
      );
    }

    const now = new Date();

    // 1. Create a new car in vc_car_master for the replacement car
    const replacementType = await prisma.vc_car_type.findFirst({
      where: { car_type_name: { contains: "ทดแทน" } },
    });
    
    const replacementStatus = await prisma.vc_car_status.findFirst({
      where: { car_status_name: { contains: "ทดแทน" } },
    });

    const newCar = await prisma.vc_car_master.create({
      data: {
        car_number: replacement_car_number,
        car_province_id: car_province_id ? Number(car_province_id) : null,
        car_spec_id: car_spec_id ? Number(car_spec_id) : null,
        car_type_id: replacementType ? replacementType.car_type_id : null,
        car_status_id: replacementStatus ? replacementStatus.car_status_id : null,
        cre_by: 1,
        cre_date: now.toISOString(),
        upd_by: 1,
        upd_date: now.toISOString(),
      },
    });

    // 2. Create vc_replacement record as a new replacement car (no broken car yet)
    const newReplacement = await prisma.vc_replacement.create({
      data: {
        car_number: replacement_car_number,
        car_province_id: car_province_id ? String(car_province_id) : null,
        car_spec_id: car_spec_id ? String(car_spec_id) : null,
        replacemant_car_id: String(newCar.car_id),
        remark: remark,
        cre_by: user,
        cre_date: now,
        upd_by: user,
        upd_date: now,
      },
    });

    return NextResponse.json({ success: true, data: newReplacement });
  } catch (error: any) {
    console.error("Error creating replacement", error);
    return NextResponse.json(
      { error: "Failed to create replacement", details: error.message },
      { status: 500 },
    );
  }
}
