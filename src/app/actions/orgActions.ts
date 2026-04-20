'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

export async function getMyOrgs() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false, data: [] };

        const userId = parseInt(session.user.id);
        const user = await prisma.vc_users.findUnique({
            where: { userid: userId }
        });

        const orgIds = user 
            ? [user.sectionid].filter(id => id != null) as string[]
            : [];

        const orgs = await prisma.vc_orgs.findMany({
            where: { 
                status: 'X',
                OR: [
                    ...(orgIds.length > 0 ? [{ orgid: { in: orgIds } }] : []),
                    { orgname: { contains: 'ยานพาหนะ' } }
                ]
            },
            orderBy: { orgid: 'asc' }
        });
        return { success: true, data: orgs };
    } catch (error) {
        console.error('Error fetching my orgs:', error);
        return { success: false, data: [] };
    }
}