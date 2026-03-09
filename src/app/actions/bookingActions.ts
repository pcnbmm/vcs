'use server';

import { prisma } from '@/lib/prisma';
import { Booking } from '@/types';
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