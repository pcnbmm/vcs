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
        const { replacement_car_number, remark } = body;

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

        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update vc_replacement
            const updatedReplacement = await tx.vc_replacement.update({
                where: { replacement_id: replacementId },
                data: {
                    car_number: replacement_car_number,
                    remark: remark,
                    upd_by: user,
                    upd_date: now
                }
            });

            // 2. If replacement_car_number changed, update vc_car_master
            if (replacement_car_number && replacement_car_number !== replacement.car_number && replacement.car_id) {
                await tx.vc_car_master.update({
                    where: { car_id: Number(replacement.car_id) },
                    data: {
                        car_number: replacement_car_number,
                        upd_by: user === "system" ? null : 1,
                        upd_date: now.toISOString()
                    }
                });
            }

            return updatedReplacement;
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error("Error updating replacement", error);
        return NextResponse.json({ error: "Failed to update replacement", details: error.message }, { status: 500 });
    }
}
