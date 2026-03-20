import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const menus = await prisma.vc_menu.findMany({
            orderBy: { menu_id: 'desc' }
        });
        return NextResponse.json(menus);
    } catch (error) {
        console.error('Error fetching menus:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        
        const newMenu = await prisma.vc_menu.create({
            data: {
                menuname: data.menuname,
                route_path: data.route_path,
                cre_by: data.cre_by || 'system',
                cre_date: new Date(),
                upd_by: data.cre_by || 'system',
                upd_date: new Date()
            }
        });

        return NextResponse.json(newMenu, { status: 201 });
    } catch (error: any) {
        console.error('Error creating menu:', error);
        return NextResponse.json(
            { error: 'Failed to create menu', details: error.message },
            { status: 500 }
        );
    }
}
