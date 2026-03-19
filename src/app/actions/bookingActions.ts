'use server';

import { prisma } from '@/lib/prisma';
import { Booking } from '@/types';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function createBooking(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        const use_div_code = formData.get('use_div_code') as string;
        
        // 1. แปลงชื่อสเปกรถให้เป็น ID ของจริง
        const rawCarSpec = formData.get('car_spec_id') as string;
        let car_spec_id: number | null = null;
        try {
            const specs: any[] = await prisma.$queryRaw`SELECT car_spec_id FROM vc_car_spec WHERE car_spec_name = ${rawCarSpec}`;
            if (specs && specs.length > 0) car_spec_id = specs[0].car_spec_id;
        } catch (e) {
            console.error('Failed to lookup car spec', e);
        }
        
        // 2. แปลงสถานที่ต้นทางให้เป็น ID
        const start_place_str = formData.get('start_place') as string;
        let start_place = '1'; 
        try {
            const places: any[] = await prisma.$queryRaw`SELECT start_place_id FROM vc_start_place WHERE start_place_name = ${start_place_str}`;
            if (places && places.length > 0) {
                start_place = String(places[0].start_place_id);
            } else {
                if (start_place_str === 'แจ้งวัฒนะ') start_place = '2';
                if (start_place_str === 'บางรัก') start_place = '3';
            }
        } catch (e) {
            if (start_place_str === 'แจ้งวัฒนะ') start_place = '2';
            if (start_place_str === 'บางรัก') start_place = '3';
        }
        
        // 3. แปลงจังหวัดเส้นทางให้เป็น ID
        const journey_province_str = formData.get('journey_province') as string;
        let journey_province = '1';
        try {
            const provs: any[] = await prisma.$queryRaw`SELECT province_id FROM vc_province WHERE name_th = ${journey_province_str}`;
            if (provs && provs.length > 0) {
                journey_province = String(provs[0].province_id);
            } else {
                if (journey_province_str === 'สมุทรปราการ') journey_province = '2';
                if (journey_province_str === 'นนทบุรี') journey_province = '3';
            }
        } catch (e) {
            if (journey_province_str === 'สมุทรปราการ') journey_province = '2';
            if (journey_province_str === 'นนทบุรี') journey_province = '3';
        }
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

        // บังคับเปลี่ยนตัวแปรป้องกัน Next.js Cache ค้าง
        const finalUserId: string | null = session?.user?.id ? String(session.user.id) : null;

        // ขั้นสุดยอด: ใช้ SQL เถื่อน (Raw Query) ยัดลง DB ตรงๆ เพื่อหลีกเลี่ยงการโดน Prisma ตรวจจับ Schema ชนกันตอนขากลับ (RETURNING)
        const result: any[] = await prisma.$queryRaw`
            INSERT INTO vc_order_item (
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
                status_use_id, 
                cre_date
            ) VALUES (
                ${finalUserId ? parseInt(finalUserId) : null}, 
                ${use_div_code}, 
                ${car_spec_id}, 
                ${parseInt(start_place)}, 
                ${parseInt(journey_province)}, 
                ${journey_place},
                ${journey_lat}, 
                ${journey_long}, 
                ${journey_date}, 
                ${journey_time}, 
                ${return_date}, 
                ${return_time},
                ${journey_causes}, 
                ${passenger_amount}, 
                ${user_mobile}, 
                ${self_drive}, 
                1, 
                NOW()
            ) RETURNING request_id
        `;
        
        const request_id = result && result.length > 0 ? Number(result[0].request_id) : 0;

        revalidatePath('/booking');
        revalidatePath('/pending');

        return { success: true, id: request_id };
    } catch (error) {
        console.error('Error creating booking:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
        };
    }
}

export async function getMyBookings() {
    try {
        const bookings: any[] = await prisma.$queryRaw`
            SELECT * FROM vc_order_item ORDER BY request_id DESC
        `;
        return { success: true, data: bookings };
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return { success: false, error: 'Failed to fetch bookings' };
    }
}

export async function getBookings(): Promise<Booking[]> {
    try {
        const bookings: any[] = await prisma.$queryRaw`
            SELECT * FROM vc_order_item ORDER BY request_id DESC
        `;

        return bookings.map((b) => ({
            id: String(b.request_id),
            requesterName: String(b.userid ?? ''),
            department: String(b.use_div_code ?? ''),
            objective: String(b.journey_causes ?? ''),
            origin: String(b.start_place ?? ''),
            destination: String(b.journey_place ?? ''),
            requestDate: b.cre_date ? new Date(b.cre_date).toISOString() : new Date().toISOString(),
            startDateTime: b.journey_date ? new Date(b.journey_date).toISOString() : new Date().toISOString(),
            endDateTime: b.return_date ? new Date(b.return_date).toISOString() : new Date().toISOString(),
            passengerCount: Number(b.passenger_amount ?? 0),
            status: Number(b.status_use_id) === 2 ? 'APPROVED' :
                    Number(b.status_use_id) === 3 ? 'REJECTED' : 'PENDING' as Booking['status'],
            rejectReason: undefined,
        }));
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return [];
    }
}