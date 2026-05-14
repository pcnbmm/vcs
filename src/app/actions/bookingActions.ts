"use server";

import { prisma } from "@/lib/prisma";
import { Booking } from "@/types";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function createBooking(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const userid = session?.user?.id ? parseInt(session.user.id) : null;
    const use_div_code = formData.get("use_div_code") as string;
    const car_spec_id = formData.get("car_spec_id")
      ? parseInt(formData.get("car_spec_id") as string)
      : null;
    const start_place = formData.get("start_place")
      ? parseInt(formData.get("start_place") as string)
      : null;
    const journey_province = formData.get("journey_province") as string;
    const journey_place = formData.get("journey_place") as string;
    const journey_lat = parseFloat(
      (formData.get("journey_lat") as string) || "0",
    );
    const journey_long = parseFloat(
      (formData.get("journey_long") as string) || "0",
    );
    const journey_date = new Date(formData.get("journey_date") as string);
    const journey_time = formData.get("journey_time") as string;
    const return_date = new Date(formData.get("return_date") as string);
    const return_time = formData.get("return_time") as string;
    const journey_causes = formData.get("journey_causes") as string;
    const passenger_amount = parseInt(
      (formData.get("passenger_amount") as string) || "1",
    );
    const user_mobile = formData.get("user_mobile") as string;
    const self_drive = formData.get("self_drive") === "true";
    const driver_id = formData.get("driver_id") ? parseInt(formData.get("driver_id") as string) : null;
    const is_urgent = formData.get("is_urgent") === "true";

    const booking = await prisma.vc_order_item.create({
      data: {
        userid,
        use_div_code,
        car_spec_id,
        start_place,
        journey_province,
        journey_place,
        journey_lat,
        journey_long,
        journey_date,
        journey_time,
        return_date,
        return_time,
        journey_causes,
        passenger_amount,
        user_mobile,
        self_drive,
        driver_id,
        is_urgent,
        status_use_id: 1, // Default to Pending
        cre_date: new Date(),
      },
    });

    revalidatePath("/booking");
    revalidatePath("/pending");

    return { success: true, id: booking.request_id };
  } catch (error) {
    console.error("Error creating booking:", error);
    return { success: false, error: "Failed to create booking" };
  }
}

export async function getMyBookings(
  userid?: number,
  personalOnly: boolean = false,
) {
  try {
    let filterId = userid;

    if (personalOnly && !filterId) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        filterId = parseInt(session.user.id);
      }
    }

    const bookings = await prisma.vc_order_item.findMany({
      where: filterId ? { userid: filterId } : undefined,
      include: {
        vc_user: true,
        vc_car_spec: true,
        vc_start_place: true,
        vc_use: {
          include: {
            // recorder_id เป็น Int → join vc_users ไม่ได้โดยตรง
            // ต้องดึงมาแล้ว manual map ข้างล่าง
          },
        },
      },
      orderBy: { request_id: "desc" },
    });

    // ดึง orgs
    const orgs = await prisma.vc_orgs.findMany({
      where: { status: "X" },
    });

    // รวบรวม recorder_id และ approve_id ทั้งหมด เพื่อ query ครั้งเดียว
    const recorderIds = [
      ...new Set(
        bookings.flatMap((b) =>
          b.vc_use.map((u) => u.recorder_id).filter(Boolean)
        )
      ),
    ] as number[];

    const dispatcherUsers = recorderIds.length > 0
      ? await prisma.vc_users.findMany({
        where: { userid: { in: recorderIds } },
        select: { userid: true, username: true, firstname: true, lastname: true, bname: true },
      })
      : [];

    const approveIds = [
      ...new Set(bookings.map((b) => b.approve_id ? Number(b.approve_id) : null).filter((id): id is number => id !== null && !isNaN(id))),
    ];

    const approverUsers = approveIds.length > 0
      ? await prisma.vc_users.findMany({
        where: { userid: { in: approveIds } },
        select: { userid: true, username: true, firstname: true, lastname: true, bname: true },
      })
      : [];

    const enrichedBookings = bookings.map((b) => {
      const org = orgs.find((o) => String(o.orgid) === b.use_div_code);
      const latestUse = b.vc_use[b.vc_use.length - 1];
      const dispatcherUser = latestUse?.recorder_id
        ? dispatcherUsers.find((u) => u.userid === latestUse.recorder_id)
        : null;

      const approverUser = b.approve_id
        ? approverUsers.find((u) => u.userid === Number(b.approve_id))
        : null;

      const formatName = (u: { bname?: string | null; firstname?: string | null; lastname?: string | null } | null) =>
        u ? `${u.bname ?? ""} ${u.firstname ?? ""} ${u.lastname ?? ""}`.trim() : null;

      return {
        ...b,
        vc_org: org ?? null,
        approver: approverUser
          ? { username: approverUser.username, name: formatName(approverUser) }
          : null,
        dispatcher: dispatcherUser
          ? { username: dispatcherUser.username, name: formatName(dispatcherUser) }
          : null,
      };
    });
    return { success: true, data: enrichedBookings };
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return { success: false, data: [], error: "Failed to fetch bookings" };
  }
}

/**
 * \u0e14\u0e36\u0e07 bookings \u0e2a\u0e33\u0e2b\u0e23\u0e31\u0e1a\u0e2b\u0e19\u0e49\u0e32 Approver / Dispatcher
 * - Admin (\u0e23\u0e2d\u0e25\u0e0a\u0e37\u0e48\u0e2d\u0e21\u0e35\u0e04\u0e33\u0e27\u0e48\u0e32 "Admin"): \u0e40\u0e2b\u0e47\u0e19\u0e17\u0e38\u0e01 request
 * - Approver / Dispatcher \u0e17\u0e35\u0e48\u0e21\u0e35 sectionid: \u0e40\u0e2b\u0e47\u0e19\u0e40\u0e09\u0e1e\u0e32\u0e30 request \u0e17\u0e35\u0e48 use_div_code === sectionid \u0e02\u0e2d\u0e07\u0e15\u0e31\u0e27\u0e40\u0e2d\u0e07
 * - \u0e16\u0e49\u0e32\u0e44\u0e21\u0e48\u0e21\u0e35 sectionid: \u0e40\u0e2b\u0e47\u0e19\u0e17\u0e38\u0e01 request (\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e04\u0e27\u0e32\u0e21\u0e40\u0e02\u0e49\u0e32\u0e01\u0e31\u0e19\u0e44\u0e14\u0e49\u0e01\u0e31\u0e1a\u0e2b\u0e19\u0e49\u0e32\u0e2a\u0e48\u0e27\u0e19\u0e01\u0e25\u0e32\u0e07)
 */
export async function getBookingsForManagement() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, data: [] };

    const userId = parseInt(session.user.id);
    const sectionid = (session.user as any).sectionid as string | null;
    const roleIds = ((session.user as any).roles as number[]) || [];

    // \u0e40\u0e0a\u0e47\u0e04\u0e27\u0e48\u0e32 user \u0e21\u0e35 role \u0e17\u0e35\u0e48\u0e0a\u0e37\u0e48\u0e2d\u0e21\u0e35\u0e04\u0e33\u0e27\u0e48\u0e32 "Admin" \u0e2b\u0e23\u0e37\u0e2d\u0e40\u0e1b\u0e25\u0e48\u0e32
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

    // \u0e16\u0e49\u0e32\u0e40\u0e1b\u0e47\u0e19 Admin \u0e2b\u0e23\u0e37\u0e2d\u0e44\u0e21\u0e48\u0e21\u0e35 sectionid \u2192 \u0e40\u0e2b\u0e47\u0e19\u0e17\u0e38\u0e01 request
    const whereClause =
      !isAdmin && sectionid ? { use_div_code: sectionid } : undefined;

    const bookings = await prisma.vc_order_item.findMany({
      where: whereClause,
      include: {
        vc_user: true,
        vc_car_spec: true,
        vc_start_place: true,
        vc_use: {},
      },
      orderBy: { request_id: "desc" },
    });

    const orgs = await prisma.vc_orgs.findMany({ where: { status: "X" } });

    const recorderIds = [
      ...new Set(
        bookings.flatMap((b) =>
          b.vc_use.map((u) => u.recorder_id).filter(Boolean),
        ),
      ),
    ] as number[];

    const dispatcherUsers =
      recorderIds.length > 0
        ? await prisma.vc_users.findMany({
            where: { userid: { in: recorderIds } },
            select: {
              userid: true,
              username: true,
              firstname: true,
              lastname: true,
              bname: true,
            },
          })
        : [];

    const approveIds = [
      ...new Set(
        bookings
          .map((b) => (b.approve_id ? Number(b.approve_id) : null))
          .filter((id): id is number => id !== null && !isNaN(id)),
      ),
    ];

    const approverUsers =
      approveIds.length > 0
        ? await prisma.vc_users.findMany({
            where: { userid: { in: approveIds } },
            select: {
              userid: true,
              username: true,
              firstname: true,
              lastname: true,
              bname: true,
            },
          })
        : [];

    const formatName = (
      u: {
        bname?: string | null;
        firstname?: string | null;
        lastname?: string | null;
      } | null,
    ) =>
      u
        ? `${u.bname ?? ""} ${u.firstname ?? ""} ${u.lastname ?? ""}`.trim()
        : null;

    const enrichedBookings = bookings.map((b) => {
      const org = orgs.find((o) => String(o.orgid) === b.use_div_code);
      const latestUse = b.vc_use[b.vc_use.length - 1];
      const dispatcherUser = latestUse?.recorder_id
        ? dispatcherUsers.find((u) => u.userid === latestUse.recorder_id)
        : null;
      const approverUser = b.approve_id
        ? approverUsers.find((u) => u.userid === Number(b.approve_id))
        : null;

      return {
        ...b,
        vc_org: org ?? null,
        approver: approverUser
          ? {
              username: approverUser.username,
              name: formatName(approverUser),
            }
          : null,
        dispatcher: dispatcherUser
          ? {
              username: dispatcherUser.username,
              name: formatName(dispatcherUser),
            }
          : null,
      };
    });

    return { success: true, data: enrichedBookings };
  } catch (error) {
    console.error("Error fetching bookings for management:", error);
    return { success: false, data: [] };
  }
}