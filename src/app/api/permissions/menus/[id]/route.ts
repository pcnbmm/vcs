import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const data = await request.json();
        const updated = await prisma.vc_menu.update({
            where: { menu_id: id },
            data: {
                menuname: data.menuname,
                route_path: data.route_path,
                upd_by: data.upd_by || 'system',
                upd_date: new Date()
            }
        });
        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error updating menu:', error);
        return NextResponse.json({ error: 'Failed to update menu', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        await prisma.vc_menu.delete({ where: { menu_id: id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting menu:', error);
        return NextResponse.json({ error: 'Failed to delete menu', details: error.message }, { status: 500 });
    }
}
