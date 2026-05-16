"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendAssignEmail } from "@/lib/mail";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// กำหนดสถานะตามที่คุณระบุ: null = ว่าง, 'x' = กำลังใช้งาน
const CAR_FLAG_AVAILABLE = null;
const CAR_FLAG_BUSY = "x";

/**
 * ดึงรายการคำขอที่รอการจัดสรร
 */
export async function getPendingDispatch() {
  try {
    const session = await getServerSession(authOptions);
    const sectionid = (session?.user as any)?.sectionid as string | null;
    const roleIds = ((session?.user as any)?.roles as number[]) || [];

    // \u0e40\u0e0a\u0e47\u0e04\u0e27\u0e48\u0e32\u0e40\u0e1b\u0e47\u0e19 Admin \u0e2b\u0e23\u0e37\u0e2d\u0e40\u0e1b\u0e25\u0e48\u0e32
    let isAdmin = false;
    if (roleIds.length > 0) {
      const roles = await prisma.vc_roles.findMany({
        where: { roles_id: { in: roleIds } },
        select: { roles_name: true },
      });
      isAdmin = roles.some((r) =>
        r.roles_name?.toLowerCase().includes("admin"),
      );
    }

    // \u0e14\u0e36\u0e07\u0e23\u0e2b\u0e31\u0e2a\u0e2a\u0e48\u0e27\u0e19\u0e20\u0e39\u0e21\u0e34\u0e20\u0e32\u0e04\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14
    const regionalProps = await prisma.vc_own_div_prop.findMany({
      where: { OR: [{ flag_del: "N" }, { flag_del: null }] },
      select: { own_div_code: true },
    });
    const regionalDivCodes = regionalProps.map((p) => p.own_div_code).filter(Boolean) as string[];

    const isRegional = sectionid ? regionalDivCodes.includes(sectionid) : false;

    let sectionFilter: any = {};

    if (!isAdmin) {
      if (isRegional) {
        sectionFilter = { use_div_code: sectionid };
      } else {
        sectionFilter = { is_regional_booking: false };
      }
    }

    const orders = await prisma.vc_order_item.findMany({
      where: {
        status_use_id: { in: [1, 2, 3, 4, 5, 6, 7] },
        ...sectionFilter,
      },
      include: {
        vc_user: {
          include: {
            department_id: true,
          },
        },
        vc_car_spec: true,
        vc_car_master: {
          include: { vc_car_brand: true },
        },
        vc_driver: {
          include: { vc_users: true },
        },
        vc_use: {
          orderBy: { use_id: "desc" },
          take: 1,
        },
        vc_start_place: true,
      },
    });

    // ดึง recorder_id ทั้งหมดจาก vc_use เพื่อ join vc_users
    const recorderIds = [
      ...new Set(
        orders
          .map((o: any) => o.vc_use?.[0]?.recorder_id)
          .filter((id: any) => id != null),
      ),
    ] as number[];

    // ดึง approver username จาก approve_id (Char(8) = username)
    // ดึง approver userid
    const approverUserIds = [
      ...new Set(
        orders
          .map((o: any) => Number(o.approve_id))
          .filter((id: any) => !isNaN(id)),
      ),
    ] as number[];

    // batch fetch users
    const [recorderUsers, approverUsers] = await Promise.all([
      recorderIds.length > 0
        ? prisma.vc_users.findMany({
            where: { userid: { in: recorderIds } },
            select: {
              userid: true,
              username: true,
              firstname: true,
              lastname: true,
            },
          })
        : [],

      approverUserIds.length > 0
        ? prisma.vc_users.findMany({
            where: { userid: { in: approverUserIds } },
            select: {
              userid: true,
              username: true,
              firstname: true,
              lastname: true,
            },
          })
        : [],
    ]);

    // Fetch Orgs manually since there's no direct relation in prisma schema
    const orgs = await prisma.vc_orgs.findMany({
      where: { status: "X" },
    });
    // Custom Sorting:
    orders.sort((a: any, b: any) => {
      // 0. Priority: ขอด่วน
      if (a.is_urgent && !b.is_urgent) return -1;
      if (!a.is_urgent && b.is_urgent) return 1;

      const dtA = getDateTimeStamp(a.journey_date, a.journey_time);
      const dtB = getDateTimeStamp(b.journey_date, b.journey_time);

      if (dtB !== dtA) return dtB - dtA; // ใหม่กว่าอยู่บน
      return b.request_id - a.request_id;
    });

    return orders.map((o: any) => {
      const latestUse = o.vc_use?.[0];

      const dispatcher = latestUse?.recorder_id
        ? recorderUsers.find((u: any) => u.userid === latestUse.recorder_id)
        : null;

      const approver = o.approve_id
        ? approverUsers.find((u: any) => u.userid === Number(o.approve_id))
        : null;

      const org = orgs.find((orgItem: any) => String(orgItem.orgid) === o.use_div_code);

      return {
        ...o,

        department: org?.orgname || o.use_div_code || "ไม่ระบุแผนก",

        isRegional: o.is_regional_booking ?? false,

        selfDriveBool:
          o.self_drive === true || o.self_drive === "Y" || o.self_drive === 1,

        approver_username: approver?.username ?? null,
        approver_firstname: approver?.firstname ?? null,
        approver_lastname: approver?.lastname ?? null,

        dispatcher_username: dispatcher?.username ?? null,
        dispatcher_firstname: dispatcher?.firstname ?? null,
        dispatcher_lastname: dispatcher?.lastname ?? null,

        pickupMethod: latestUse?.pickup_method ?? o.pickup_method ?? null,
      };
    });
  } catch (error) {
    console.error("Error fetching pending assignments:", error);
    return [];
  }
}
/**
 * ดึงรายชื่อรถยนต์ (เฉพาะคันที่ flag เป็น null)
 */
export async function getAvailableCars(
  divCode?: string,
  includeCarId?: number,
) {
  try {
    const cars = await prisma.vc_car_master.findMany({
      where: {
        OR: [
          { flag: { equals: null } },
          includeCarId ? { car_id: includeCarId } : {},
        ],
        ...(divCode ? { own_div_code: divCode } : {}),
        vc_car_status: {
          car_status_name: {
            contains: "ใช้งาน",
          },
        },
      },
      include: {
        vc_car_brand: true,
        vc_car_spec: true,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validCars = cars.filter((car) => {
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
        OR: [{ flag_del: null }, { flag_del: { not: "1" } }],
      },
      orderBy: { car_spec_name: "asc" },
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
  const session = await getServerSession(authOptions);
  const recorderId = session?.user?.id ? parseInt(session.user.id) : null;
  console.log("=== API ASSIGN RESOURCE ===");
  console.log("Request ID:", data.requestId);
  console.log("Selected Car ID:", data.carId);
  console.log("Selected Driver ID:", data.driverId);
  console.log("===========================");

  try {
    // 1. ตรวสอบข้อมูลเดิม
    const existingOrder = await prisma.vc_order_item.findUnique({
      where: { request_id: data.requestId },
      select: {
        car_id: true,
        driver_id: true,
        journey_causes: true,
        status_use_id: true,
      },
    });

    const isEdit =
      existingOrder?.status_use_id === 4 || existingOrder?.status_use_id === 5;

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
        driver_id: data.driverId,
        status_use_id: existingOrder?.status_use_id === 1 ? 7 : 4, // 7 = dispatched_pending, 4 = in_use
        pickup_status: null,
        upd_date: new Date(),
      };

      if (data.isTaxi) {
        updateData.pickup_method = "TAXI";
        updateData.car_id = null;
        updateData.driver_id = null;
        updateData.status_use_id = 5;
        updateData.pickup_status = null;
        if (data.taxiReason && existingOrder) {
          const oldCauses = existingOrder.journey_causes
            ? existingOrder.journey_causes + "\n\n"
            : "";
          updateData.journey_causes =
            oldCauses + `[เหตุผลการจัดแท็กซี่: ${data.taxiReason}]`;
        }
      }

      // อัปเดตรายการจองรถ (ตัวหลักที่เรามีปัญหา)
      console.log("Updating Order with Driver ID:", data.driverId);
      const orderUpdate = await tx.vc_order_item.update({
        where: { request_id: data.requestId },
        data: updateData,
        include: {
          vc_user: {
            include: {
              section_id: true,
            },
          },
          vc_car_master: { include: { vc_car_brand: true } },
          vc_driver: { include: { vc_users: true } },
          vc_start_place: true,
        },
      });
      await tx.vc_use.create({
        data: {
          request_id: data.requestId,
          recorder_id: recorderId,
          cre_date: new Date(),
          cre_by: recorderId,
        },
      });

      return orderUpdate;
    });

    console.log("✅ Update Complete in DB");

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
        startTime: result.journey_time
          ? result.journey_time.slice(0, 5)
          : undefined,
        startPlace: result.vc_start_place?.start_place_name || result.journey_origin_text || undefined,
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

/**
 * ยกเลิกคำขอใช้รถ (โดยนายเวร)
 */
export async function cancelBooking(data: {
  requestId: number;
  reason: string;
}) {
  try {
    const order = await prisma.vc_order_item.findUnique({
      where: { request_id: data.requestId },
    });

    if (!order) return { success: false as const, error: "ไม่พบคำขอนี้ในระบบ" };

    await prisma.$transaction(async (tx) => {
      if (order.car_id) {
        await tx.vc_car_master.update({
          where: { car_id: order.car_id },
          data: { flag: null },
        });
      }

      await tx.vc_order_item.update({
        where: { request_id: data.requestId },
        data: {
          status_use_id: 6,
          dispatcher_reject_reason: data.reason,
          car_id: null,
          driver_id: null,
          upd_date: new Date(),
        },
      });
    });

    revalidatePath("/assign");
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}
function getDateTimeStamp(date?: Date | string | null, time?: string | null) {
  if (!date) return Number.MAX_SAFE_INTEGER;

  const d = new Date(date);

  if (time) {
    const [hours, minutes] = time.split(":").map(Number);

    d.setHours(hours || 0);
    d.setMinutes(minutes || 0);
    d.setSeconds(0);
  }

  return d.getTime();
}

function isAssignExpired(date?: Date | string | null, time?: string | null) {
  return getDateTimeStamp(date, time) < Date.now();
}
