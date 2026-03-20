import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const data = await request.json();
        const updated = await prisma.vc_function.update({
            where: { function_id: id },
            data: {
                func_name: data.func_name,
                upd_by: data.upd_by || 'system',
                upd_date: new Date()
            }
        });
        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error updating function:', error);
        return NextResponse.json({ error: 'Failed to update function', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        await prisma.vc_function.delete({ where: { function_id: id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting function:', error);
        return NextResponse.json({ error: 'Failed to delete function', details: error.message }, { status: 500 });
    }
}
