import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const menus = await prisma.vc_menu.findMany({
      orderBy: { menu_id: "desc" },
    });
    return NextResponse.json(menus);
  } catch (error) {
    console.error("Error fetching menus:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { menuname, route_path } = data;

    // 1. Create database record
    const newMenu = await prisma.vc_menu.create({
      data: {
        menuname: menuname,
        route_path: route_path,
        cre_by: data.cre_by || "system",
        cre_date: new Date(),
        upd_by: data.cre_by || "system",
        upd_date: new Date(),
      },
    });

    // 2. Automatically create folder and page.tsx if route_path is provided
    if (route_path && route_path !== "#" && route_path !== "/") {
      try {
        // Clean route_path: remove leading slash if exists
        const cleanPath = route_path.startsWith("/") ? route_path.slice(1) : route_path;
        
        // Target directory: src/app/(workspace)/[cleanPath]
        const targetDir = path.join(process.cwd(), "src", "app", "(workspace)", cleanPath);
        const targetFile = path.join(targetDir, "page.tsx");

        // Create directory recursively
        await fs.mkdir(targetDir, { recursive: true });

        // Check if file already exists
        try {
          await fs.access(targetFile);
          // File exists, skip creation
        } catch {
          // File doesn't exist, create default page template
          const template = `"use client";
import React from "react";
import { Construction, Layout } from "lucide-react";

export default function ${menuname.replace(/\s+/g, "")}Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in duration-700">
      <div className="relative">
        <div className="absolute -inset-4 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
        <div className="relative p-8 bg-white rounded-3xl shadow-xl border border-blue-50 text-blue-600">
          <Layout size={48} className="animate-bounce" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
          ${menuname}
        </h1>
        <p className="text-slate-500 font-medium max-w-xs mx-auto">
          หน้านี้กำลังอยู่ระหว่างการพัฒนา... คุณสามารถเริ่มแก้ไขไฟล์ที่ <br/>
          <code className="text-xs bg-slate-100 px-2 py-1 rounded mt-2 inline-block font-mono">
            src/app/(workspace)/${cleanPath}/page.tsx
          </code>
        </p>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
        <Construction size={14} />
        UNDER CONSTRUCTION
      </div>
    </div>
  );
}
`;
          await fs.writeFile(targetFile, template, "utf8");
        }
      } catch (fsError) {
        console.error("Error creating physical folder/file:", fsError);
        // We don't fail the whole request if only the file creation fails, 
        // but we should probably log it.
      }
    }

    return NextResponse.json(newMenu, { status: 201 });
  } catch (error: any) {
    console.error("Error creating menu:", error);
    return NextResponse.json(
      { error: "Failed to create menu", details: error.message },
      { status: 500 },
    );
  }
}
