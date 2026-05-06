import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(
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

    const body = await req.json();
    const { car_id, remark, start_date, broken_datetime } = body;

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
        { error: "Cannot edit a cancelled/ended replacement" },
        { status: 400 },
      );
    }

    const now = new Date();
    const startDt = start_date ? new Date(start_date) : now;

    // Transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. If we are linking to a broken car for the first time
      let originalCarNumber = null;
      if (car_id && !replacement.car_id) {
        const originalCar = await tx.vc_car_master.findUnique({
          where: { car_id: Number(car_id) },
        });

        if (!originalCar) throw new Error("Original car not found");
        originalCarNumber = originalCar.car_number || "-";

        // We no longer overwrite the original car's license plate. 
        // The original car keeps its plate, and the replacement car has its own car_id.

        // Update broken car status to 'ใช้รถทดแทน'
        const brokenStatus = await tx.vc_car_status.findFirst({
          where: { car_status_name: { contains: "ใช้รถทดแทน" } },
        });
        if (brokenStatus) {
          await tx.vc_car_master.update({
            where: { car_id: Number(car_id) },
            data: { car_status_id: brokenStatus.car_status_id },
          });
        }

        // Update replacement car status to 'ใช้งานอยู่'
        const activeStatus = await tx.vc_car_status.findFirst({
          where: { car_status_name: { contains: "ใช้งานอยู่" } },
        });
        if (activeStatus && replacement.replacemant_car_id) {
          await tx.vc_car_master.update({
            where: { car_id: Number(replacement.replacemant_car_id) },
            data: { car_status_id: activeStatus.car_status_id },
          });
        }
      }

      // 2. Update vc_replacement
      const updatedReplacement = await tx.vc_replacement.update({
        where: { replacement_id: replacementId },
        data: {
          ...(car_id && !replacement.car_id
            ? {
                car_id: Number(car_id),
                broken_car_id: originalCarNumber,
                start_datetime: startDt.toISOString(),
                broken_datetime: broken_datetime || null,
              }
            : {}),
          remark: remark,
          upd_by: user,
          upd_date: now,
        },
      });

      return updatedReplacement;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error updating replacement", error);
    return NextResponse.json(
      { error: "Failed to update replacement", details: error.message },
      { status: 500 },
    );
  }
}
