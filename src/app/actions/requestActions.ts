"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendApproveEmail } from "@/lib/mail";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * อัปเดตสถานะคำขอใช้รถ (อนุมัติ/ปฏิเสธ)
 * @param request_id ไอดีของคำขอ (Int)
 * @param status_id สถานะที่ต้องการเปลี่ยน (2 = อนุมัติ, 3 = ปฏิเสธ)
 */
export async function updateRequestStatus(
  request_id: number,
  status_id: number,
  rejectReason?: string,
) {
  try {
    const session = await getServerSession(authOptions);
    const approver_id = session?.user?.id ? String(session.user.id) : null;

    // Check if the request is already cancelled (status 6)
    const currentStatusResults: any[] = await prisma.$queryRaw`
      SELECT status_use_id FROM vc_order_item WHERE request_id = ${request_id}
    `;
    
    if (
      currentStatusResults.length > 0 &&
      currentStatusResults[0].status_use_id === 6
    ) {
      return {
        success: false,
        error: "ไม่สามารถทำรายการได้ เนื่องจากคำขอนี้ถูกยกเลิกแล้ว",
      };
    }

    const currentStatus = currentStatusResults.length > 0 ? currentStatusResults[0].status_use_id : 1;

    let targetStatus = status_id;
    if (currentStatus === 7 && status_id === 2) {
      // จัดรถแล้ว (7) + กดอนุมัติ → ใช้งานได้เลย (4)
      targetStatus = 4;
    } else if ((currentStatus === 4 || currentStatus === 5) && status_id === 2) {
      // IN_USE (4) หรือ COMPLETED (5) + อนุมัติย้อนหลัง → คงสถานะเดิม แค่บันทึก approve_id
      targetStatus = currentStatus;
    }

    // หากปฏิเสธและเคยจัดรถไปแล้ว (Status 7) ต้องคืน Flag รถด้วย
    if (currentStatus === 7 && status_id === 3) {
      const order = await prisma.vc_order_item.findUnique({
        where: { request_id },
        select: { car_id: true },
      });
      if (order?.car_id) {
        await prisma.vc_car_master.update({
          where: { car_id: order.car_id },
          data: { flag: null },
        });
      }
    }

    // 1. ใช้ SQL ดิบเพื่ออัปเดตสถานะ ป้องกัน Prisma บ่นเรื่อง Type mismatch ของ userid ที่ขากลับ
    await prisma.$executeRaw`
            UPDATE vc_order_item 
            SET status_use_id = ${targetStatus}, 
            approve_id = ${approver_id},
            reject_reason = ${rejectReason ?? null}
            WHERE request_id = ${request_id}
        `;

    // 2. ถ้าสถานะเป็น 2 (APPROVED) ค่อยดึงข้อมูลเพื่อส่ง Email
    if (status_id === 2) {
      const results: any[] = await prisma.$queryRaw`
                SELECT o.*, s.start_place_name 
                FROM vc_order_item o
                LEFT JOIN vc_start_place s ON o.start_place = s.start_place_id
                WHERE o.request_id = ${request_id}
            `;
      const requestData = results[0];
      console.log("[EmailService] Debug requestData:", requestData);

      if (requestData) {
        // ดึงค่าแบบยืดหยุ่น (เผื่อกรณี DB return column name ตัวเล็กตัวใหญ่ไม่ตรงกับ schema)
        const uid =
          requestData.userid ?? requestData.UserID ?? requestData.userId;
        const dest =
          requestData.journey_place ??
          requestData.Journey_place ??
          requestData.journeyPlace;
        const causes =
          requestData.journey_causes ??
          requestData.Journey_causes ??
          requestData.journeyCauses;
        const jDate =
          requestData.journey_date ??
          requestData.Journey_date ??
          requestData.journeyDate;
        const jTime =
          requestData.journey_time ??
          requestData.Journey_time ??
          requestData.journeyTime;
        const sPlace =
          requestData.start_place_name ??
          requestData.Start_place_name ??
          requestData.startPlaceName;

        if (uid) {
          // ค้นหาพนักงานตาม User ID (ตัวเลข)
          const userResults: any[] = await prisma.$queryRaw`
                        SELECT * FROM vc_users WHERE userid = ${Number(uid)}
                    `;
          const user = userResults[0];
          console.log("[EmailService] Debug userData:", user);

          if (user && user.email) {
            await sendApproveEmail({
              to: user.email,
              requesterName: user.firstname
                ? `${user.firstname} ${user.lastname || ""}`
                : String(uid),
              requestId: Number(requestData.request_id || request_id),
              destination: String(dest || "ไม่ระบุ"),
              objective: String(causes || "ไม่ระบุ"),
              startDate: jDate
                ? new Date(jDate).toLocaleDateString("th-TH")
                : "ไม่ระบุ",
              startTime: jTime ? String(jTime).slice(0, 5) : undefined,
              startPlace: sPlace ? String(sPlace) : undefined,
            });
          } else {
            console.log(
              `[EmailService] ไม่สามารถส่งอีเมลได้ เนื่องจากไม่พบ email ของผู้ขอใช้รถ (User ID: ${uid})`,
            );
          }
        }
      }
    }

    // ล้าง Cache เพื่อให้หน้าแสดงผลข้อมูลล่าสุด
    revalidatePath("/pending");
    revalidatePath("/approver-requests");
    revalidatePath("/history");

    return { success: true };
  } catch (error) {
    console.error("Failed to update request status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "ขออภัย เกิดข้อผิดพลาดในการอัปเดตสถานะ",
    };
  }
}
export async function cancelRequest(request_id: number) {
  try {
    await prisma.$executeRaw`
            UPDATE vc_order_item 
            SET status_use_id = 6
            WHERE request_id = ${request_id}
        `;
    revalidatePath("/pending");
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
