"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMaintenanceFormData() {
  const [cars, drivers, causes, treats] = await Promise.all([
    prisma.vc_car_master.findMany({
      where: {
        flag: null,
        vc_car_status: {
          car_status_name: {
            contains: "ใช้งาน",
          },
        },
      },
      include: {
        vc_car_brand: true,
      },
    }),
    prisma.vc_driver.findMany({
      include: {
        vc_users: true,
      },
    }),
    prisma.vc_maintenance_cause.findMany({
      where: { flag_del: { not: "D" } },
    }),
    prisma.vc_treat.findMany({
      where: { flag_del: { not: "D" } },
    }),
  ]);

  return {
    cars: cars.map((car) => ({
      value: car.car_id.toString(),
      label: `${car.car_number} (${car.vc_car_brand?.car_brand_name || ""})`,
      number: car.car_number,
      brand: car.vc_car_brand?.car_brand_name,
    })),
    drivers: drivers.map((d) => ({
      value: d.driver_id.toString(),
      label: `${d.vc_users?.firstname || ""} ${d.vc_users?.lastname || ""}`,
    })),
    causes: causes.map((c) => ({
      value: c.cause_id.toString(),
      label: c.cause_detail,
    })),
    treats: treats.map((t) => ({
      value: t.treat_id.toString(),
      label: t.treat_name,
    })),
  };
}

export async function getLatestCarMileage(carId: number | null) {
  if (!carId) return { success: false, mile_end: 0 };
  try {
    const latestUse = await prisma.vc_use.findFirst({
      where: { car_id: carId },
      orderBy: { use_id: "desc" },
      select: { mile_end: true },
    });
    
    // Also check maintenance records
    const latestMaintenance = await prisma.vc_maintenance_item.findFirst({
      where: { car_id: carId },
      orderBy: { maintenance_item_id: "desc" },
      select: { mile_car_in: true, mile_car_out: true },
    });

    const mileFromUse = latestUse?.mile_end ?? 0;
    const mileFromMaint = latestMaintenance?.mile_car_out ?? latestMaintenance?.mile_car_in ?? 0;

    return { success: true, mile_end: Math.max(mileFromUse, mileFromMaint) };
  } catch (error) {
    console.error("Error fetching latest car mileage:", error);
    return { success: false, error: "Failed to fetch mileage", mile_end: 0 };
  }
}

export async function saveMaintenance(data: {
  car_id: number;
  maintenance_date: string;
  start_time: string;
  emp_id: number;
  station_name: string;
  cause_id?: number;
  cause_detail?: string;
  treat_ids?: number[]; // Multi-select
  new_treats?: string[]; // New treats added
  mile_car_in: number;
  mile_car_out?: number;
  finish_date?: string;
  finish_time?: string;
  vat?: number;
  spare_items: {
    name: string;
    amount: number;
    price: number;
  }[];
  cre_by: string;
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Handle Cause
      let finalCauseId = data.cause_id;
      if (!finalCauseId && data.cause_detail) {
        const newCause = await tx.vc_maintenance_cause.create({
          data: {
            cause_detail: data.cause_detail,
            cre_by: data.cre_by,
            cre_date: new Date(),
            upd_by: data.cre_by,
            upd_date: new Date(),
          },
        });
        finalCauseId = newCause.cause_id;
      }

      // 2. Handle Multiple Treats
      const finalTreatIds: number[] = [...(data.treat_ids || [])];
      
      if (data.new_treats && data.new_treats.length > 0) {
        for (const name of data.new_treats) {
          const newTreat = await tx.vc_treat.create({
            data: {
              treat_name: name,
              cre_by: data.cre_by,
              cre_date: new Date(),
              upd_by: data.cre_by,
              upd_date: new Date(),
            },
          });
          finalTreatIds.push(newTreat.treat_id);
        }
      }

      // 3. Create Maintenance Item
      const maintenance = await tx.vc_maintenance_item.create({
        data: {
          car_id: data.car_id,
          maintenance_date: data.maintenance_date ? new Date(data.maintenance_date) : null,
          start_time: data.start_time,
          emp_id: data.emp_id,
          station_name: data.station_name,
          cause_id: finalCauseId,
          mile_car_in: data.mile_car_in,
          mile_car_out: data.mile_car_out,
          finish_date: data.finish_date ? new Date(data.finish_date) : null,
          finish_time: data.finish_time,
          vat: data.vat,
          treat_id: finalTreatIds.length > 0 ? finalTreatIds[0] : undefined,
          cre_by: data.cre_by,
          cre_date: new Date(),
          upd_by: data.cre_by,
          upd_date: new Date(),
        },
      });

      // 4. Link Treats
      if (finalTreatIds.length > 0) {
        await tx.vc_maintenance_treat.createMany({
          data: finalTreatIds.map(tid => ({
            maintenance_item_id: maintenance.maintenance_item_id,
            treat_id: tid
          }))
        });
      }

      // 5. Handle Spare Items
      if (data.spare_items && data.spare_items.length > 0) {
        await tx.vc_maintenance_spare_item.createMany({
          data: data.spare_items.map((item) => ({
            maintenance_item_id: maintenance.maintenance_item_id,
            spare_item_name: item.name,
            spare_amount: item.amount,
            spare_price: item.price,
            cre_by: data.cre_by,
            cre_date: new Date(),
            upd_by: data.cre_by,
            upd_date: new Date(),
          })),
        });
      }

      // 6. Update Car Status and Flag based on whether it's finished or not
      const isFinished = !!data.finish_date;
      
      const targetStatusName = isFinished ? "ปกติ" : "ซ่อม";
      const targetStatus = await tx.vc_car_status.findFirst({
        where: { car_status_name: { contains: targetStatusName } }
      });

      await tx.vc_car_master.update({
        where: { car_id: data.car_id },
        data: { 
          flag: isFinished ? null : "x",
          ...(targetStatus ? { car_status_id: targetStatus.car_status_id } : {})
        }
      });

      revalidatePath("/maintenance");
      return { success: true, maintenance_id: maintenance.maintenance_item_id };
    });
  } catch (error: any) {
    console.error("Error saving maintenance:", error);
    return { success: false, error: error.message };
  }
}
