'use server';

import { prisma } from '@/lib/prisma';

export async function getStartPlaces() {
    try {
        const startPlaces = await prisma.vc_start_place.findMany({
            where: { flag_del: null },
            include: {
                province: true // ← ดึงจังหวัดมาด้วย
            },
            orderBy: { start_place_id: 'asc' }
        });
        return { success: true, data: startPlaces };
    } catch (error) {
        console.error('Error fetching start places:', error);
        return { success: false, data: [] };
    }
}