"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'

/**
 * อัปเดตสถานะคำขอใช้รถ (อนุมัติ/ปฏิเสธ)
 * @param request_id ไอดีของคำขอ (Int)
 * @param status_id สถานะที่ต้องการเปลี่ยน (2 = อนุมัติ, 3 = ปฏิเสธ)
 */
export async function updateRequestStatus(request_id: number, status_id: number) {
    try {
        await prisma.vc_order_item.update({
            where: {
                request_id: request_id
            },
            data: {
                status_use_id: status_id
            }
        });

        // ล้าง Cache เพื่อให้หน้าแสดงผลข้อมูลล่าสุด
        revalidatePath('/pending');
        revalidatePath('/approver-requests');
        revalidatePath('/history');

        return { success: true };
    } catch (error) {
        console.error("Failed to update request status:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "ขออภัย เกิดข้อผิดพลาดในการอัปเดตสถานะ" 
        };
    }
}
