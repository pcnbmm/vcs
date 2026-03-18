'use server';

import { prisma } from '@/lib/prisma';

export async function getOrgs() {
    try {
        const orgs = await prisma.vc_orgs.findMany({
            where: { status: 'X' }, // ← เฉพาะที่ active
            orderBy: { orgid: 'asc' }
        });
        return { success: true, data: orgs };
    } catch (error) {
        console.error('Error fetching orgs:', error);
        return { success: false, data: [] };
    }
}