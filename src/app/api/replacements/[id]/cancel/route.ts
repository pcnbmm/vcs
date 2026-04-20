import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user?.name || "system";
    const { id } = await params;
    const replacementId = Number(id);

    if (!replacementId || isNaN(replacementId)) {
      return NextResponse.json(
        { error: "Invalid replacement ID" },
        { status: 400 },
      );
    }

    const replacement = await prisma.vc_replacement.findUnique({
      where: { replacement_id: replacementId },
    });

    if (!replacement) {
      return NextResponse.json(
        { error: "Replacement not found" },
        { status: 404 },
      );
    }

    if (replacement.end_datetime) {
      return NextResponse.json(
        { error: "This replacement is already cancelled/ended" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const end_date = body.end_date ? new Date(body.end_date) : new Date();

    // The original car number was stored in broken_car_id
    const originalCarNumber = replacement.broken_car_id;
    const carId = replacement.car_id;
    const now = new Date();

    if (!carId || !originalCarNumber) {
      return NextResponse.json(
        { error: "Missing original car mapping data" },
        { status: 400 },
      );
    }

    // Find car type 'รถเช่า'
    const rentCarType = await prisma.vc_car_type.findFirst({
      where: { car_type_name: { contains: "เช่า" } }, // use "เช่า" to be safe
    });

    // Find car status 'ปกติ' or 'พร้อม'
    const normalStatus = await prisma.vc_car_status.findFirst({
      where: {
        OR: [
          { car_status_name: { contains: "ปกติ" } },
          { car_status_name: { contains: "ใช้งาน" } },
          { car_status_name: { contains: "พร้อม" } },
        ],
      },
    });

    // Transaction to restore the car plate and close the replacement record
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update vc_replacement to set end date
      const updatedReplacement = await tx.vc_replacement.update({
        where: { replacement_id: replacementId },
        data: {
          end_datetime: end_date.toISOString(),
          end_date: end_date,
          upd_by: user,
          upd_date: now,
        },
      });

      // 2. Restore the original plate and type in vc_car_master
      await tx.vc_car_master.update({
        where: { car_id: Number(carId) },
        data: {
          car_number: originalCarNumber,
          ...(rentCarType ? { car_type_id: rentCarType.car_type_id } : {}),
          ...(normalStatus
            ? { car_status_id: normalStatus.car_status_id }
            : {}),
          upd_by: user === "system" ? null : 1,
          upd_date: now.toISOString(),
        },
      });

      return updatedReplacement;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error cancelling replacement", error);
    return NextResponse.json(
      { error: "Failed to cancel replacement", details: error.message },
      { status: 500 },
    );
  }
}
