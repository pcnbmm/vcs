'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createBooking(formData: FormData) {
    try {
        const use_div_code = formData.get('use_div_code') as string;
        const car_spec_id = formData.get('car_spec_id') ? parseInt(formData.get('car_spec_id') as string) : null;
        const start_place = formData.get('start_place') as string;
        const journey_province = formData.get('journey_province') as string;
        const journey_place = formData.get('journey_place') as string;
        const journey_lat = parseFloat(formData.get('journey_lat') as string || '0');
        const journey_long = parseFloat(formData.get('journey_long') as string || '0');
        const journey_date = new Date(formData.get('journey_date') as string);
        const journey_time = formData.get('journey_time') as string;
        const return_date = new Date(formData.get('return_date') as string);
        const return_time = formData.get('return_time') as string;
        const journey_causes = formData.get('journey_causes') as string;
        const passenger_amount = parseInt(formData.get('passenger_amount') as string || '1');
        const user_mobile = formData.get('user_mobile') as string;
        const self_drive = formData.get('self_drive') === 'true';

        const booking = await prisma.vc_order_item.create({
            data: {
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
                status_use_id: 1, // Default to Pending
                cre_date: new Date(),
            }
        });

        revalidatePath('/booking');
        revalidatePath('/pending');

        return { success: true, id: booking.request_id };
    } catch (error) {
        console.error('Error creating booking:', error);
        return { success: false, error: 'Failed to create booking' };
    }
}

export async function getMyBookings() {
    try {
        const bookings = await prisma.vc_order_item.findMany({
<<<<<<< HEAD
            orderBy: { request_id: 'desc' }
=======
            orderBy: {
                request_id: 'desc'
            }
>>>>>>> docker
        });
        return { success: true, data: bookings };
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return { success: false, error: 'Failed to fetch bookings' };
    }
}

export async function getHistoryBookings() {
    try {
        const bookings = await prisma.vc_order_item.findMany({
<<<<<<< HEAD
            where: {
                status_use_id: {
                    in: [2, 3, 5, 6] // 2=approved, 3=rejected, 5=completed, 6=cancelled
                }
            },
            include: {
                vc_status_use_code: true  // ดึงชื่อสถานะจาก DB โดยตรง
            },
            orderBy: { request_id: 'desc' }
        });
        return { success: true, data: bookings };
    } catch (error) {
        console.error('Error fetching history bookings:', error);
        return { success: false, error: 'Failed to fetch history bookings' };
    }
}

export async function getPendingBookings() {
    try {
        const bookings = await prisma.vc_order_item.findMany({
            where: {
                status_use_id: 1 // 1 = pending
            },
            include: {
                vc_status_use_code: true  // ดึงชื่อสถานะจาก DB โดยตรง
            },
            orderBy: { request_id: 'desc' }
        });
        return { success: true, data: bookings };
    } catch (error) {
        console.error('Error fetching pending bookings:', error);
        return { success: false, error: 'Failed to fetch pending bookings' };
    }
}

export async function cancelRequest(request_id: number) {
    try {
        await prisma.vc_order_item.update({
            where: { request_id: request_id },
            data: {
                status_use_id: 6, // 6 = cancelled
                upd_date: new Date()
            }
        });

        revalidatePath('/pending');
        revalidatePath('/history');

        return { success: true };
=======
            orderBy: { request_id: 'desc' }
        });

        return bookings.map((b) => ({
            id: String(b.request_id),
            requesterName: b.userid ?? '',
            department: b.use_div_code ?? '',
            objective: b.journey_causes ?? '',
            origin: b.start_place ?? '',
            destination: b.journey_place ?? '',
            requestDate: b.cre_date?.toISOString() ?? new Date().toISOString(),
            startDateTime: b.journey_date?.toISOString() ?? new Date().toISOString(),
            endDateTime: b.return_date?.toISOString() ?? new Date().toISOString(),
            passengerCount: b.passenger_amount ?? 0,
            status: b.status_use_id === 2 ? 'APPROVED' :
                b.status_use_id === 3 ? 'REJECTED' : 'PENDING' as Booking['status'],
            rejectReason: undefined,
        }));
>>>>>>> docker
    } catch (error) {
        console.error('Error cancelling request:', error);
        return { success: false, error: 'Failed to cancel request' };
    }
}