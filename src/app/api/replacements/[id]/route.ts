import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user?.name || "system";
        const { id } = await params;
        const replacementId = Number(id);

        if (!replacementId || isNaN(replacementId)) {
            return NextResponse.json({ error: "Invalid replacement ID" }, { status: 400 });
        }

        const body = await req.json();
        const { car_id, remark, start_date, broken_datetime } = body;

        const replacement = await prisma.vc_replacement.findUnique({
            where: { replacement_id: replacementId }
        });

        if (!replacement) {
            return NextResponse.json({ error: "Replacement not found" }, { status: 404 });
        }

        if (replacement.end_datetime) {
            return NextResponse.json({ error: "Cannot edit a cancelled/ended replacement" }, { status: 400 });
        }

        const now = new Date();
        const startDt = start_date ? new Date(start_date) : now;

        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. If we are linking to a broken car for the first time
            let originalCarNumber = null;
            if (car_id && !replacement.car_id) {
                const originalCar = await tx.vc_car_master.findUnique({
                    where: { car_id: Number(car_id) }
                });
                
                if (!originalCar) throw new Error("Original car not found");
                originalCarNumber = originalCar.car_number || "-";

                // Find car type 'ทดแทน'
                const replacementType = await tx.vc_car_type.findFirst({
                    where: { car_type_name: { contains: "ทดแทน" } }
                });

                const replacementStatus = await tx.vc_car_status.findFirst({
                    where: { car_status_name: { contains: "ทดแทน" } }
                });

                // Update vc_car_master to the replacement plate
                await tx.vc_car_master.update({
                    where: { car_id: Number(car_id) },
                    data: {
                        car_number: replacement.car_number,
                        car_type_id: replacementType ? replacementType.car_type_id : originalCar.car_type_id,
                        ...(replacementStatus ? { car_status_id: replacementStatus.car_status_id } : {}),
                        upd_by: user === "system" ? null : 1,
                        upd_date: now.toISOString()
                    }
                });
            }

            // 2. Update vc_replacement
            const updatedReplacement = await tx.vc_replacement.update({
                where: { replacement_id: replacementId },
                data: {
                    ...(car_id && !replacement.car_id ? { 
                        car_id: Number(car_id),
                        broken_car_id: originalCarNumber,
                        start_datetime: startDt.toISOString(),
                        start_date: startDt,
                        broken_datetime: broken_datetime || null
                    } : {}),
                    remark: remark,
                    upd_by: user,
                    upd_date: now
                }
            });

            return updatedReplacement;
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error("Error updating replacement", error);
        return NextResponse.json({ error: "Failed to update replacement", details: error.message }, { status: 500 });
    }
}
