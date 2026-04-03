'use server';

import { prisma } from '@/lib/prisma';

export async function getCarSpecs(orgId?: string) {
    try {
        const whereClause: any = { flag_del: null };
        
        if (orgId) {
            whereClause.vc_car_master = {
                some: { own_div_code: orgId }
            };
        }

        const carSpecs = await prisma.vc_car_spec.findMany({
            where: whereClause,
            orderBy: { car_spec_id: 'asc' }
        });
        return { success: true, data: carSpecs };
    } catch (error) {
        console.error('Error fetching car specs:', error);
        return { success: false, data: [] };
    }
}