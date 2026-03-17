'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Fetch all users for the requester dropdown
export async function getUrgentRequesters() {
    try {
        const users = await prisma.vc_users.findMany({
            select: {
                userid: true,
                firstname: true,
                lastname: true,
                departmentid: true,
            },
            orderBy: {
                firstname: 'asc'
            }
        });
        return { success: true, data: users };
    } catch (error) {
        console.error('Error fetching requesters:', error);
        return { success: false, error: 'Failed to fetch requesters' };
    }
}

// Create Urgent Booking
export async function createUrgentBooking(formData: FormData) {
    try {
        const requester_id = formData.get('requester_id') as string;
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

        // Assuming approve_id is the string representation of an admin/นายเวร. 
        // We hardcode it to 'ADMIN' or session user ID for now as requested.
        const mockApproveId = '99999999';

        const booking = await prisma.vc_order_item.create({
            data: {
                userid: requester_id, // Store selected user ID
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
                status_use_id: 2, // 2 = Approved/Pending Dispatch (ข้ามการอนุมัติ)
                approve_id: mockApproveId, // บันทึก ID ของนายเวร
                is_urgent: true,  // <-- ฟิลด์ใหม่ที่เพิ่มใน Schema
                cre_date: new Date(),
            }
        });

        // Revalidate relevant pages
        revalidatePath('/urgent');
        revalidatePath('/assign');
        revalidatePath('/dashboard');

        return { success: true, id: booking.request_id };
    } catch (error) {
        console.error('Error creating urgent booking:', error);
        return { success: false, error: 'Failed to create urgent booking' };
    }
}
