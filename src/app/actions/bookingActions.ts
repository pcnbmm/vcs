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

    // If personalOnly is true and no userid is passed, get it from the session
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
      },
      orderBy: { request_id: "desc" },
    });

    // Manual mapping for org names since there's no direct relation
    const orgs = await prisma.vc_orgs.findMany({
      where: { status: "X" },
    });

    const enrichedBookings = bookings.map((b) => {
      const org = orgs.find((o) => String(o.orgid) === b.use_div_code);
      return {
        ...b,
        vc_org: org || null,
      };
    });

    return { success: true, data: enrichedBookings };
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return { success: false, data: [], error: "Failed to fetch bookings" };
  }
}
