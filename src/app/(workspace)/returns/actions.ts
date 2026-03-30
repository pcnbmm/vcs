"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getOrdersForReturn() {
    try {
        const orders = await prisma.vc_order_item.findMany({
            where: {
                status_use_id: { in: [4, 5] } // 4 = in_use, 5 = completed
            },
            include: {
                vc_user: true,
                vc_car_master: {
                    include: {
                        vc_car_brand: true,
                        vc_car_spec: true
                    }
                },
                vc_driver: {
                    include: {
                        vc_users: true
                    }
                },
                vc_car_spec: true,
                vc_start_place: true,
                vc_use: true
            },
            orderBy: {
                request_id: 'desc'
            }
        });
        const users = await prisma.vc_users.findMany({
            select: {
                userid: true,
                firstname: true,
                lastname: true,
            }
        });

        const orgs = await prisma.vc_orgs.findMany({
            select: {
                orgid: true,
                orgname: true
            }
        });

        const userMap = new Map(users.map((u: any) => [u.userid.toString(), u]));
        const orgMap = new Map(orgs.map((o: any) => [o.orgid.toString(), o.orgname]));

        const ordersWithApprover = orders.map(order => {
            const approver = order.approve_id ? userMap.get(order.approve_id.trim()) : null;
            const orgName = order.use_div_code ? orgMap.get(order.use_div_code.trim()) : null;
            return {
                ...order,
                approver_name: approver ? `${approver.firstname} ${approver.lastname}` : (order.approve_id || "-"),
                use_div_name: orgName || order.use_div_code || "ฝ่ายบริหาร"
            };
        });

        return { success: true, data: ordersWithApprover };
    } catch (error) {
        console.error("Error fetching orders for return:", error);
        return { success: false, error: "Failed to fetch orders" };
    }
}

export async function saveReturnRecord(data: {
    request_id: number;
    car_id: number;
    drive_type: string;
    approved_by: number;
    journey_real_time: string;
    return_real_time: string;
    return_real_date: string;
    mile_begin: number;
    mile_end: number;
    driver_id: number | null;
    note?: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        const recorder_id = session?.user?.id ? parseInt(session.user.id) : null;

        await prisma.$transaction(async (tx) => {
            // 1. Update Order Status to 5 (completed - ตามรูปจาก Prisma Studio)
            await tx.vc_order_item.update({
                where: { request_id: data.request_id },
                data: {
                    status_use_id: 5,
                    upd_date: new Date(),
                    upd_by: session?.user?.name || 'system'
                }
            });

            // 2. Release the Car (Set flag to null) - Only if car_id exists
            if (data.car_id) {
                await tx.vc_car_master.update({
                    where: { car_id: Number(data.car_id) },
                    data: { flag: null }
                });
            }

            // 3. Create record in vc_use
            await tx.vc_use.create({
                data: {
                    request_id: data.request_id,
                    car_id: data.car_id,
                    drive_type: data.drive_type,
                    approved_by: data.approved_by,
                    journey_real_time: data.journey_real_time,
                    return_real_time: data.return_real_time,
                    return_real_date: new Date(data.return_real_date),
                    mile_begin: data.mile_begin,
                    mile_end: data.mile_end,
                    driver_id: data.driver_id ? String(data.driver_id) : null,
                    note: data.note || "",
                    cre_by: recorder_id,
                    cre_date: new Date(),
                    upd_by: recorder_id,
                    upd_date: new Date(),
                    recorder_id: recorder_id
                }
            });
        });

        revalidatePath("/returns");
        revalidatePath("/history");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error: any) {
        console.error("Error saving return record:", error);
        return { success: false, error: error.message || "Failed to save record" };
    }
}

export async function getDispatchers() {
    try {
        const users = await prisma.vc_users.findMany({
            select: {
                userid: true,
                firstname: true,
                lastname: true,
            },
            orderBy: {
                firstname: 'asc'
            }
        });
        return { success: true, data: users };
    } catch (error) {
        console.error("Error fetching dispatchers:", error);
        return { success: false, error: "Failed to fetch dispatchers" };
    }
}

export async function getLatestCarMileage(carId: number | null) {
    if (!carId) return { success: false, mile_end: 0 };
    try {
        const latestUse = await prisma.vc_use.findFirst({
            where: { car_id: carId },
            orderBy: { use_id: 'desc' },
            select: { mile_end: true }
        });
        return { success: true, mile_end: latestUse?.mile_end ?? 0 };
    } catch (error) {
        console.error("Error fetching latest car mileage:", error);
        return { success: false, error: "Failed to fetch mileage", mile_end: 0 };
    }
}
