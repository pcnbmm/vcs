'use server';

import { prisma } from '@/lib/prisma';

export async function getCarSpecs() {
    try {
        const carSpecs = await prisma.vc_car_spec.findMany({
            where: { flag_del: null },
            orderBy: { car_spec_id: 'asc' }
        });
        return { success: true, data: carSpecs };
    } catch (error) {
        console.error('Error fetching car specs:', error);
        return { success: false, data: [] };
    }
}