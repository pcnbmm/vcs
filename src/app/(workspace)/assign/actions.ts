"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// กำหนดสถานะตามที่คุณระบุ: null = ว่าง, 'x' = กำลังใช้งาน
const CAR_FLAG_AVAILABLE = null;
const CAR_FLAG_BUSY = "x";

/**
 * ดึงรายการคำขอที่รอการจัดสรร
 */
export async function getPendingDispatch() {
  try {
    const orders = await prisma.vc_order_item.findMany({
      where: {
        status_use_id: 2, 
      },
      include: {
        vc_user: true,
        vc_car_spec: true
      },
      orderBy: {
        journey_date: "asc"
      }
    });
    return orders;
  } catch (error) {
    console.error("Error fetching pending assignments:", error);
    return [];
  }
}

/**
 * ดึงรายการคำขอที่จัดสรรแล้ว
 */
export async function getAssignedOrders() {
    try {
      const orders = await prisma.vc_order_item.findMany({
        where: {
          status_use_id: 4,
        },
        include: {
          vc_user: true, 
          vc_car_master: true,
          vc_driver: {
            include: {
                vc_users: true
            }
          }
        },
        orderBy: {
          upd_date: "desc",
        },
      });
      return orders;
    } catch (error) {
      console.error("Error fetching assigned orders:", error);
      return [];
    }
}

/**
 * ดึงรายชื่อรถยนต์ (เฉพาะคันที่ flag เป็น null)
 */
export async function getAvailableCars() {
  try {
    const cars = await prisma.vc_car_master.findMany({
      where: {
        flag: { equals: null }
      },
      include: {
        vc_car_brand: true,
        vc_car_spec: true,
      }
    });
    return cars;
  } catch (error) {
    console.error("Error fetching available cars:", error);
    return [];
  }
}

/**
 * ดึงรายชื่อพนักงานขับรถ
 */
export async function getDrivers() {
  try {
    const drivers = await prisma.vc_driver.findMany({
      include: {
        vc_users: true,
      },
    });
    return drivers;
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return [];
  }
}

/**
 * บันทึกการจัดสรรทรัพยากร และอัปเดตฟิลด์ flag ของรถ
 */
export async function assignResource(data: {
  requestId: number;
  carId: number;
  driverId: number | null;
}) {
  // สรุปข้อมูลที่ได้รับมา
  console.log("=== API ASSIGN RESOURCE ===");
  console.log("Request ID:", data.requestId);
  console.log("Selected Car ID:", data.carId);
  console.log("Selected Driver ID:", data.driverId);
  console.log("===========================");
  
  try {
    // 1. ตรวสอบข้อมูลเดิม
    const existingOrder = await prisma.vc_order_item.findUnique({
        where: { request_id: data.requestId },
        select: { car_id: true, driver_id: true }
    });

    // 2. ใช้ Transaction
    const result = await prisma.$transaction(async (tx) => {
        
        // จัดการเรื่องสถานะรถคันเก่า (ถ้ามี)
        if (existingOrder?.car_id && existingOrder.car_id !== data.carId) {
            console.log("Release old car flag:", existingOrder.car_id);
            await tx.vc_car_master.update({
                where: { car_id: existingOrder.car_id },
                data: { flag: null }
            });
        }

        // ล็อกคันใหม่
        if (data.carId) {
            console.log("Setting busy flag for car:", data.carId);
            await tx.vc_car_master.update({
                where: { car_id: data.carId },
                data: { flag: "x" }
            });
        }

        // อัปเดตรายการจองรถ (ตัวหลักที่เรามีปัญหา)
        console.log("Updating Order with Driver ID:", data.driverId);
        const orderUpdate = await tx.vc_order_item.update({
            where: { request_id: data.requestId },
            data: {
                car_id: data.carId,
                driver_id: data.driverId, // มั่นใจว่าค่านี้ไม่เป็น NaN (ตัวเลขหรือ null เท่านั้น)
                status_use_id: 5, // บันทึกเป็นสำเร็จทันที (ไม่ต้องรอ Confirm)
                upd_date: new Date(),
            },
        });
        
        return orderUpdate;
    });

    console.log("✅ Update Complete in DB");
    revalidatePath("/assign");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("❌ FAILED:", error.message);
    return { success: false, error: "เกิดข้อผิดพลาดในการบันทึก: " + error.message };
  }
}

/**
 * ยืนยันคำขอ
 */
export async function confirmAssignment(requestId: number) {
    try {
      await prisma.vc_order_item.update({
        where: { request_id: requestId },
        data: {
          status_use_id: 5,
          upd_date: new Date(),
        },
      });
  
      revalidatePath("/assign");
      return { success: true };
    } catch (error) {
      console.error("Error confirming assignment:", error);
      return { success: false };
    }
}
