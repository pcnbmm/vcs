import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const replacements = await prisma.vc_replacement.findMany({
            include: {
                vc_car_master: true
            },
            orderBy: {
                replacement_id: 'desc'
            }
        });

        return NextResponse.json(replacements);
    } catch (error) {
        console.error("Error fetching replacements", error);
        return NextResponse.json({ error: "Failed to fetch replacements" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user?.name || "system";

        const body = await req.json();
        const { car_id, replacement_car_number, remark } = body;

        if (!car_id || !replacement_car_number) {
            return NextResponse.json({ error: "car_id and replacement_car_number are required" }, { status: 400 });
        }

        // Get the original car to save its plate
        const originalCar = await prisma.vc_car_master.findUnique({
            where: { car_id: Number(car_id) }
        });

        if (!originalCar) {
            return NextResponse.json({ error: "Original car not found" }, { status: 404 });
        }

        const originalCarNumber = originalCar.car_number || "-";
        const now = new Date();

        // Find car type 'ทดแทน'
        const replacementType = await prisma.vc_car_type.findFirst({
            where: { car_type_name: { contains: "ทดแทน" } }
        });

        // Find car status 'ใช้รถทดแทน' or 'ทดแทน'
        const replacementStatus = await prisma.vc_car_status.findFirst({
            where: { car_status_name: { contains: "ทดแทน" } }
        });

        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create vc_replacement record
            // We store the ORIGINAL car_number in broken_car_id 
            // and the NEW replacement car_number in car_number
            const newReplacement = await tx.vc_replacement.create({
                data: {
                    car_id: Number(car_id),
                    car_number: replacement_car_number,
                    broken_car_id: originalCarNumber,
                    start_datetime: now.toISOString(),
                    start_date: now,
                    remark: remark,
                    cre_by: user,
                    cre_date: now,
                    upd_by: user,
                    upd_date: now
                }
            });

            // 2. Update vc_car_master to the replacement plate and update car_type
            await tx.vc_car_master.update({
                where: { car_id: Number(car_id) },
                data: {
                    car_number: replacement_car_number,
                    car_type_id: replacementType ? replacementType.car_type_id : originalCar.car_type_id,
                    ...(replacementStatus ? { car_status_id: replacementStatus.car_status_id } : {}),
                    upd_by: user === "system" ? null : 1, // Optional: handle integer update_by if needed
                    upd_date: now.toISOString()
                }
            });

            return newReplacement;
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error("Error creating replacement", error);
        return NextResponse.json({ error: "Failed to create replacement", details: error.message }, { status: 500 });
    }
}
