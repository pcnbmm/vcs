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
        const { replacement_car_number, car_province_id, car_spec_id, remark } = body;

        if (!replacement_car_number) {
            return NextResponse.json({ error: "replacement_car_number is required" }, { status: 400 });
        }

        const now = new Date();

        // 1. Create vc_replacement record as a new replacement car (no broken car yet)
        const newReplacement = await prisma.vc_replacement.create({
            data: {
                car_number: replacement_car_number,
                car_province_id: car_province_id ? String(car_province_id) : null,
                car_spec_id: car_spec_id ? String(car_spec_id) : null, // Store car type ID here for now
                remark: remark,
                cre_by: user,
                cre_date: now,
                upd_by: user,
                upd_date: now
            }
        });

        return NextResponse.json({ success: true, data: newReplacement });
    } catch (error: any) {
        console.error("Error creating replacement", error);
        return NextResponse.json({ error: "Failed to create replacement", details: error.message }, { status: 500 });
    }
}
