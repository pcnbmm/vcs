import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET() {
    const menus = await prisma.vc_menu.findMany();
    const menuRoles = await prisma.vc_menu_role.findMany();
    return NextResponse.json({ menus, menuRoles });
}
