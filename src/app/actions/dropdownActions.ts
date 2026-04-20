'use server';

import { prisma } from '@/lib/prisma';

export async function getProvinces() {
    try {
        const provinces = await prisma.vc_province.findMany({
            orderBy: { province_name: 'asc' }
        });
        return { success: true, data: provinces };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function getCarTypes() {
    try {
        const types = await prisma.vc_car_type.findMany({
            orderBy: { car_type_name: 'asc' }
        });
        return { success: true, data: types };
    } catch (error) {
        return { success: false, data: [] };
    }
}
