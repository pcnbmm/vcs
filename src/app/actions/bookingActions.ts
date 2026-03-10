'use server';

import { prisma } from '@/lib/prisma';
import { Booking } from '@/types';
import { revalidatePath } from 'next/cache';

export async function createBooking(formData: FormData) {
    try {
        const use_div_code = formData.get('use_div_code') as string;
        const car_spec_id = formData.get('car_spec_id') as string;
        const start_place = formData.get('start_place') as string;
        const journey_province = formData.get('journey_province') as string;
        const journey_place = formData.get('journey_place') as string;
        const journey_lat = parseFloat(formData.get('journey_lat') as string || '0');
        const journey_long = parseFloat(formData.get('journey_long') as string || '0');
        const journey_date = new Date(formData.get('journey_date') as string);
        const journer_time = formData.get('journer_time') as string;
        const return_date = new Date(formData.get('return_date') as string);
        const return_time = formData.get('return_time') as string;
        const journey_causes = formData.get('journey_causes') as string;
        const passenger_amount = parseInt(formData.get('passenger_amount') as string || '1');
        const user_mobile = formData.get('user_mobile') as string;
        const self_drive = formData.get('self_drive') === 'true';

        const booking = await prisma.vcOrderItems.create({
            data: {
                use_div_code,
                car_spec_id,
                start_place,
                journey_province,
                journey_place,
                journey_lat,
                journey_long,
                journey_date,
                journer_time,
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
        const bookings = await prisma.vcOrderItems.findMany({
            orderBy: {
                request_id: 'desc'
            }
        });
        return { success: true, data: bookings };
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return { success: false, error: 'Failed to fetch bookings' };
    }
}

export async function getBookings(): Promise<Booking[]> {
    try {
        const bookings = await prisma.booking.findMany({
            include: {
                User: {
                    select: {
                        name: true,
                    }
                }
            },
            orderBy: {
                requestDate: 'desc',
            }
        });
        return bookings.map((b) => ({
            id: b.bookingNo ?? b.id,
            requesterName: b.User.name ?? '',
            department: b.department,
            objective: b.objective,
            origin: b.origin,
            destination: b.destination,
            requestDate: b.requestDate.toISOString(),
            startDateTime: b.startDateTime.toISOString(),
            endDateTime: b.endDateTime.toISOString(),
            passengerCount: b.passengerCount,
            status: b.status as Booking['status'],
            rejectReason: b.rejectReason ?? undefined,
        }));
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return [];
    }
}