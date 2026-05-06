import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const body = await req.json();

    const updatedDriver = await prisma.vc_driver.update({
      where: { driver_id: parseInt(id) },
      data: {
        driver_code: body.driver_code
          ? parseInt(body.driver_code.toString())
          : null,
        driver_status:
          body.driver_status !== undefined ? body.driver_status : undefined,
        div_code: body.div_code !== undefined ? body.div_code : undefined,
        start_date: body.start_date ? new Date(body.start_date) : null,
        end_date: body.end_date ? new Date(body.end_date) : null,
        licence_type: body.licence_type
          ? parseInt(body.licence_type.toString())
          : null,
        licence_no: body.licence_no !== undefined ? body.licence_no : undefined,
        licence_by: body.licence_by
          ? parseInt(body.licence_by.toString())
          : null,
        tel: body.tel !== undefined ? body.tel : undefined,
        flag: body.flag !== undefined ? body.flag : undefined,
        upd_date: new Date(),
      },
    });

    return NextResponse.json(updatedDriver);
  } catch (error) {
    console.error("Failed to update driver:", error);
    return NextResponse.json(
      { error: "Failed to update driver" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id);

    // 1. ตรวจสอบว่าพนักงานคนนี้เคยถูกนำไปใช้งานในตาราง "จัดรถ" หรือยัง
    // หมายเหตุ: เปลี่ยน 'vc_car_manage' เป็นชื่อตารางจริงใน Schema ของคุณที่เก็บการจับคู่รถกับคนขับ
    const isUsed = await prisma.vc_order_item.findFirst({
      where: {
        OR: [
          { driver_id: id },
          // ถ้ามีฟิลด์คนขับสำรอง หรือ staff ให้เช็คเพิ่มตรงนี้
          // { staff_id: id } 
        ]
      },
    });

    // 2. ถ้าพบข้อมูลการใช้งาน ห้ามลบเด็ดขาด
    if (isUsed) {
      return NextResponse.json(
        {
          error: "ไม่สามารถลบได้ เนื่องจากพนักงานรายนี้มีประวัติการจัดรถในระบบแล้ว",
          code: "DATA_IN_USE"
        },
        { status: 400 } // ส่ง 400 Bad Request
      );
    }

    // 3. ถ้าไม่พบข้อมูลการใช้งาน ค่อยอนุญาตให้ลบ
    await prisma.vc_driver.delete({
      where: { driver_id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete driver:", error);

    // ดักจับ Error กรณีติด Foreign Key จาก Database (ถ้าลืมเช็คในข้อ 1)
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "ลบไม่สำเร็จ ข้อมูลนี้ถูกใช้งานอยู่ในตารางอื่น" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบข้อมูล" },
      { status: 500 },
    );
  }
}
