import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDriverExpiryEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
    try {
        const { driver_code, end_date } = await req.json();

        // เช็คว่าวันนี้อยู่ในช่วง 1 เดือนก่อน end_date ไหม
        const today = new Date();
        const endDateObj = new Date(end_date);
        const notifyDate = new Date(end_date);
        notifyDate.setMonth(notifyDate.getMonth() - 1);

        if (today < notifyDate || today > endDateObj) {
            return NextResponse.json({
                success: false,
                reason: "not in notify window",
                notifyDate: notifyDate.toISOString(),
                today: today.toISOString(),
            });
        }

        // หา driver + email
        //const driver = await prisma.vc_driver.findFirst({
        //where: { driver_code: Number(driver_code) },
        //include: {
        //vc_users: {
        //select: {
        //firstname: true,
        //lastname: true,
        //email: true,
        //},
        //},
        //},
        //});

        // ในไฟล์ /api/drivers/notify-expiry
        const driver = await prisma.vc_driver.findFirst({
            where: { driver_code: Number(driver_code) },
            include: {
                vc_users: true, // ลองเปลี่ยนจาก select เป็น true เพื่อดูค่าทั้งหมดที่ออกมา
            },
        });

        console.log("Debug Driver:", driver);

        //const email = driver?.vc_users?.email;
        //if (!email) {
        //return NextResponse.json({ success: false, reason: "no email" });
        //}

        const user = driver?.vc_users;
        const email = user?.email;

        if (!email) {
            return NextResponse.json({
                success: false,
                reason: "no email",
                debug: {
                    found_driver: !!driver,
                    has_user_relation: !!user,
                    user_data: user // ดูว่าใน object นี้มี field email จริงไหม หรือชื่อ field เป็นอย่างอื่น
                }
            });
        }

        const name = `${driver?.vc_users?.firstname || ""} ${driver?.vc_users?.lastname || ""}`.trim();
        const expDate = endDateObj.toLocaleDateString("th-TH", {
            year: "numeric", month: "long", day: "numeric",
        });
        const notifyDateStr = notifyDate.toLocaleDateString("th-TH", {
            year: "numeric", month: "long", day: "numeric",
        });

        const result = await sendDriverExpiryEmail({
            to: email,
            notifyDate: notifyDateStr,
            drivers: [{
                name,
                driver_code: String(driver_code),
                end_date: expDate,
            }],
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("[notify-expiry] error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}