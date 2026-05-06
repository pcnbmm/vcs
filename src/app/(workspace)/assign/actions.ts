"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendAssignEmail } from "@/lib/mail";

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
        OR: [
          { status_use_id: { in: [2, 4] } },
          { status_use_id: 5, pickup_method: "TAXI" },
        ],
      },
      include: {
        vc_user: true,
        vc_car_spec: true,
        vc_car_master: {
          include: { vc_car_brand: true },
        },
        vc_driver: {
          include: { vc_users: true },
        },
      },
    });

    // Helper for expired check
    const isAssignExpired = (journeyDate: any, journeyTime: string | null) => {
      if (!journeyDate) return false;
      const d = new Date(journeyDate);
      const dateStr =
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0");
      let timeStr = journeyTime ? journeyTime.trim() : "23:59:59";
      if (timeStr.split(":").length === 2) {
        timeStr += ":00";
      }
      const deadline = new Date(`${dateStr}T${timeStr}`);
      return new Date() > deadline;
    };

    const getDateTimeStamp = (journeyDate: any, journeyTime: string | null) => {
      if (!journeyDate) return 0;
      const d = new Date(journeyDate);
      const dateStr =
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0");
      let timeStr = journeyTime ? journeyTime.trim() : "00:00:00";
      if (timeStr.split(":").length === 2) {
        timeStr += ":00";
      }
      return new Date(`${dateStr}T${timeStr}`).getTime();
    };

    // Custom Sorting:
    orders.sort((a: any, b: any) => {
      const getPriority = (o: any) => {
        const isCompleted =
          (o.status_use_id === 4 &&
            (o.pickup_status === "PICKED_UP" ||
              o.pickup_status === "TAXI_CALLED")) ||
          (o.status_use_id === 5 && o.pickup_method === "TAXI");

        if (!isCompleted && isAssignExpired(o.journey_date, o.journey_time)) {
          return 4; // คำขอหมดอายุ (Expired)
        }
        if (o.status_use_id === 2) return 1; // จัดรถ
        if (o.status_use_id === 4 && !o.pickup_status) return 2; // จัดรถรอยืนยัน
        if (isCompleted) return 3; // เสร็จสิ้น
        return 5;
      };

      const pA = getPriority(a);
      const pB = getPriority(b);

      if (pA !== pB) return pA - pB;

      // วันที่ใกล้ถึงที่สุด เอาขึ้นก่อน
      const dateA = getDateTimeStamp(a.journey_date, a.journey_time);
      const dateB = getDateTimeStamp(b.journey_date, b.journey_time);
      if (dateA !== dateB) return dateA - dateB;

      // เรียงจากใหม่ไปเก่าสำหรับ fallback
      return b.request_id - a.request_id;
    });

    return orders;
  } catch (error) {
    console.error("Error fetching pending assignments:", error);
    return [];
  }
}

/**
 * ดึงรายชื่อรถยนต์ (เฉพาะคันที่ flag เป็น null)
 */
export async function getAvailableCars(divCode?: string) {
  try {
    const cars = await prisma.vc_car_master.findMany({
      where: {
        flag: { equals: null },
        ...(divCode ? { own_div_code: divCode } : {}),
        vc_car_status: {
          car_status_name: {
            contains: "ใช้งาน"
          }
        }
      },
      include: {
        vc_car_brand: true,
        vc_car_spec: true,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validCars = cars.filter(car => {
      if (car.end_date) {
        const endDt = new Date(car.end_date);
        if (!isNaN(endDt.getTime()) && endDt < today) {
          return false; // Car has expired
        }
      }
      return true;
    });

    return validCars;
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
 * ดึงรายการประเภทรถทั้งหมด
 */
export async function getCarSpecs() {
  try {
    const specs = await prisma.vc_car_spec.findMany({
      where: {
        OR: [
          { flag_del: null },
          { flag_del: { not: "1" } }
        ]
      },
      orderBy: { car_spec_name: "asc" }
    });
    return specs;
  } catch (error) {
    console.error("Error fetching car specs:", error);
    return [];
  }
}

/**
 * บันทึกการจัดสรรทรัพยากร และอัปเดตฟิลด์ flag ของรถ
 */
export async function assignResource(data: {
  requestId: number;
  carId: number | null;
  driverId: number | null;
  isTaxi?: boolean;
  taxiReason?: string;
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
      select: { car_id: true, driver_id: true, journey_causes: true, status_use_id: true },
    });
    
    const isEdit = existingOrder?.status_use_id === 4 || existingOrder?.status_use_id === 5;

    // 2. ใช้ Transaction
    const result = await prisma.$transaction(async (tx) => {
      // จัดการเรื่องสถานะรถคันเก่า (ถ้ามี)
      if (existingOrder?.car_id && existingOrder.car_id !== data.carId) {
        console.log("Release old car flag:", existingOrder.car_id);
        await tx.vc_car_master.update({
          where: { car_id: existingOrder.car_id },
          data: { flag: null },
        });
      }

      // ล็อกคันใหม่
      if (data.carId) {
        console.log("Setting busy flag for car:", data.carId);
        await tx.vc_car_master.update({
          where: { car_id: data.carId },
          data: { flag: "x" },
        });
      }

      const updateData: any = {
        car_id: data.carId,
        driver_id: data.driverId, // มั่นใจว่าค่านี้ไม่เป็น NaN (ตัวเลขหรือ null เท่านั้น)
        status_use_id: 4, // 4 = in_use (เพื่อให้ไปปรากฏในหน้าคืนรถ)
        pickup_status: null, // Reset pickup status เผื่อมี
        upd_date: new Date(),
      };

      if (data.isTaxi) {
        updateData.pickup_method = "TAXI";
        updateData.car_id = null;
        updateData.driver_id = null;
        updateData.status_use_id = 5;
        updateData.pickup_status = null;
        if (data.taxiReason && existingOrder) {
          const oldCauses = existingOrder.journey_causes ? existingOrder.journey_causes + "\n\n" : "";
          updateData.journey_causes = oldCauses + `[เหตุผลการจัดแท็กซี่: ${data.taxiReason}]`;
        }
      }

      // อัปเดตรายการจองรถ (ตัวหลักที่เรามีปัญหา)
      console.log("Updating Order with Driver ID:", data.driverId);
      const orderUpdate = await tx.vc_order_item.update({
        where: { request_id: data.requestId },
        data: updateData,
        include: {
          vc_user: true,
          vc_car_master: { include: { vc_car_brand: true } },
          vc_driver: { include: { vc_users: true } },
          vc_start_place: true,
        },
      });

      return orderUpdate;
    });

    console.log("✅ Update Complete in DB");

    // ส่ง Email ถ้ามีข้อมูล
    if (result.vc_user?.email) {
      const carName = `${result.vc_car_master?.car_number || "ไม่ระบุ"} ${result.vc_car_master?.vc_car_brand?.car_brand_name || ""}`;
      let driverName = "ขับเอง";
      if (result.vc_driver?.vc_users) {
        driverName = `${result.vc_driver.vc_users.firstname || ""} ${result.vc_driver.vc_users.lastname || ""}`;
      }

      console.log("📧 Sending assign email to:", result.vc_user.email);
      await sendAssignEmail({
        to: result.vc_user.email,
        requesterName: `${result.vc_user.firstname || ""} ${result.vc_user.lastname || ""}`,
        requestId: result.request_id,
        destination: result.journey_place || "ไม่ระบุปลายทาง",
        startDate: result.journey_date
          ? result.journey_date.toLocaleDateString("th-TH")
          : "-",
        startTime: result.journey_time ? result.journey_time.slice(0, 5) : undefined,
        startPlace: result.vc_start_place?.start_place_name || undefined,
        taxiReason: data.taxiReason,
        isEdit: isEdit,
        carName: carName,
        driverName: driverName,
      });
    }

    revalidatePath("/assign");
    return { success: true as const, data: result };
  } catch (error: any) {
    console.error("❌ FAILED:", error.message);
    return {
      success: false as const,
      error: "เกิดข้อผิดพลาดในการบันทึก: " + error.message,
    };
  }
}

/**
 * บันทึกการรับรถ (ไม่ว่าจะเป็นรับเองหรือมีคนขับไปให้) / รวมถึงกรณีไม่มารับรถ
 */
export async function recordPickupResource(data: {
  requestId: number;
  pickupStatus: string; // 'PICKED_UP' หรือ 'NO_SHOW'
  pickupDate?: string | Date;
  pickupTime?: string;
  pickupMethod?: string;
}) {
  try {
    console.log("=== RECORD PICKUP ===");
    console.log("Data:", data);

    // ถ้า NO_SHOW (ไม่มารับรถ) ปกติจะยกเลิกคำขอ หรือคืนสถานะรถว่าง
    if (data.pickupStatus === "NO_SHOW") {
      await prisma.$transaction(async (tx) => {
        // 1. ดึงข้อมูลว่าจองรถคันไหนไป
        const order = await tx.vc_order_item.findUnique({
          where: { request_id: data.requestId },
        });

        // 2. ปลดล็อกรถ
        if (order?.car_id) {
          await tx.vc_car_master.update({
            where: { car_id: order.car_id },
            data: { flag: null },
          });
        }

        // 3. เปลี่ยนสถานะคำขอ เช่น อาจจะปรับเป็น status_use_id: 3 (Cancel) หรือปล่อยเป็น 4 ไว้แต่มีสถานะ pickup_status บอกแทน
        // ตามที่ตกลงกัน "เหมือนกับยกเลิกคำขอไช้รถมา" เราอาจจะปรับสถานะ
        // ไม่แน่ใจว่า 3 คือ Cancel หรือเปล่า (ปกติใช่) สมมติใช้ status 3 ถ้ามี
        await tx.vc_order_item.update({
          where: { request_id: data.requestId },
          data: {
            pickup_status: data.pickupStatus,
            pickup_date: data.pickupDate ? new Date(data.pickupDate) : null,
            pickup_time: data.pickupTime,
            pickup_method: data.pickupMethod,
            status_use_id: 3, // หมายเลข 3 ปกติคือไม่อนุมัติ/ยกเลิก
            upd_date: new Date(),
          },
        });
      });
    } else {
      // มารับรถจริง
      await prisma.vc_order_item.update({
        where: { request_id: data.requestId },
        data: {
          pickup_status: data.pickupStatus,
          pickup_date: data.pickupDate ? new Date(data.pickupDate) : null,
          pickup_time: data.pickupTime,
          pickup_method: data.pickupMethod,
          upd_date: new Date(),
        },
      });
    }

    revalidatePath("/assign");
    return { success: true as const };
  } catch (error: any) {
    console.error("❌ FAILED to record pickup:", error.message);
    return { success: false as const, error: error.message };
  }
}
