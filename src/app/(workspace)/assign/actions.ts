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
        flag: { equals: null } // ใช้รูปแบบ Filter ให้ชัดเจน
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
  console.log("Starting assignResource for Request:", data.requestId, "New Car:", data.carId);
  
  try {
    // 1. ตรวจสอบข้อมูลปัจจุบันก่อน
    const existingOrder = await prisma.vc_order_item.findUnique({
        where: { request_id: data.requestId },
        select: { car_id: true }
    });

    console.log("Current assigned car in DB:", existingOrder?.car_id);

    // 2. ใช้ Transaction เพื่อความปลอดภัย
    const result = await prisma.$transaction(async (tx) => {
        
        // ถ้าคันเก่าไม่ใช่คันใหม่ ให้ปลดล็อกคันเก่า (เป็นว่าง)
        if (existingOrder?.car_id && existingOrder.car_id !== data.carId) {
            console.log("Releasing old car:", existingOrder.car_id);
            await tx.vc_car_master.update({
                where: { car_id: existingOrder.car_id },
                data: { flag: null } // ตั้งเป็น null เพื่อให้ว่าง
            });
        }

        // ล็อกคันใหม่ (เป็น 'x')
        console.log("Locking new car:", data.carId);
        await tx.vc_car_master.update({
            where: { car_id: data.carId },
            data: { flag: "x" } // ตั้งเป็น 'x' เพื่อให้ไม่ว่าง
        });

        // อัปเดตรายการจองรถ
        const orderUpdate = await tx.vc_order_item.update({
            where: { request_id: data.requestId },
            data: {
                car_id: data.carId,
                driver_id: data.driverId,
                status_use_id: 4,
                upd_date: new Date(),
            },
        });
        
        return orderUpdate;
    }, {
        timeout: 10000 // เพิ่ม Timeout เผื่อ Database ช้า
    });

    console.log("Assignment successful for Request:", data.requestId);
    revalidatePath("/assign");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("FAILED to assign resource:", error.message);
    return { success: false, error: "เกิดข้อผิดพลาด: " + error.message };
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
