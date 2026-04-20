import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const plate = searchParams.get('plate');
        const province = searchParams.get('province');

        if (!plate) {
            return NextResponse.json({ error: "Plate is required" }, { status: 400 });
        }

        const car = await prisma.vc_car_master.findFirst({
            where: {
                car_number: plate,
                ...(province ? { car_province_id: Number(province) } : {})
            }
        });

        return NextResponse.json({ exists: !!car });
    } catch (error) {
        console.error("Error checking car:", error);
        return NextResponse.json({ error: "Failed to check car" }, { status: 500 });
    }
}
