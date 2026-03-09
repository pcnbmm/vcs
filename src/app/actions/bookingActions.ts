"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { getAddressFromLatLon } from './mapActions'
import { VcOrderItems } from '../../../generated/prisma/client'

export async function createBooking(formData: FormData) {
    try {
        const data = {
            use_div_code: formData.get('use_div_code') as string,
            car_spec_id: formData.get('car_spec_id') as string,
            start_place: formData.get('start_place') as string,
            journey_province: formData.get('journey_province') as string || null,
            journey_place: formData.get('journey_place') as string,
            journey_lat: formData.get('journey_lat') ? parseFloat(formData.get('journey_lat') as string) : null,
            journey_long: formData.get('journey_long') ? parseFloat(formData.get('journey_long') as string) : null,
            journey_date: formData.get('journey_date') ? new Date(formData.get('journey_date') as string) : null,
            return_date: formData.get('return_date') ? new Date(formData.get('return_date') as string) : null,
            journer_time: formData.get('journer_time') as string,
            return_time: formData.get('return_time') as string,
            journey_causes: formData.get('journey_causes') as string || null,
            passenger_amount: parseInt(formData.get('passenger_amount') as string || "0"),
            user_mobile: formData.get('user_mobile') as string,
            self_drive: formData.get('self_drive') === 'true',
            status_use_id: 1, // 1 = รอดำเนินการ (Pending)
            cre_by: 'SYSTEM',
            cre_date: new Date(),
        }

        const newBooking = await prisma.vcOrderItems.create({
            data: data,
        })

        revalidatePath('/booking-history')
        return { success: true, id: newBooking.request_id } // id -> request_id
    } catch (error) {
        console.error("Booking Error:", error)
        const errObj = error as any;
        return { success: false, error: errObj.message || "บันทึกข้อมูลไม่สำเร็จ" }
    }
}

export async function getMyBookings() {
    try {
        const bookings = await prisma.vcOrderItems.findMany({
            orderBy: { cre_date: 'desc' }
        });

        // Resolve names for old records that have 'ตำแหน่งปัจจุบัน'
        const processedBookings = await Promise.all(bookings.map(async (b: VcOrderItems) => {
            if (b.journey_place === 'ตำแหน่งปัจจุบัน' && b.journey_lat && b.journey_long) {
                try {
                    const addrData = await getAddressFromLatLon(b.journey_lat, b.journey_long);
                    if (addrData && addrData.province) {
                        const newName = `${addrData.subdistrict ? addrData.subdistrict + ' ' : ''}${addrData.district ? addrData.district + ' ' : ''}${addrData.province}`;

                        // Update the database in background (fire and forget)
                        prisma.vcOrderItems.update({
                            where: { request_id: b.request_id },
                            data: { journey_place: newName }
                        }).catch((e: Error) => console.error("Auto-fix error:", e));

                        return { ...b, journey_place: newName };
                    }
                } catch (err) {
                    console.error("Failed to reverse geocode:", err);
                }
            }
            return b;
        }));

        return { success: true, data: processedBookings };
    } catch (error) {
        console.error("Fetch Error:", error);
        return { success: false, data: [] };
    }
}