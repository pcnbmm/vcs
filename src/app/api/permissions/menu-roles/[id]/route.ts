import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    // Repurposed to delete all mappings for a specific roles_id
    try {
        const rolesId = parseInt(params.id);
        if (isNaN(rolesId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        await prisma.vc_menu_role.deleteMany({ 
            where: { roles_id: rolesId } 
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting menu-roles:', error);
        return NextResponse.json({ error: 'Failed to remove menu roles', details: error.message }, { status: 500 });
    }
}
