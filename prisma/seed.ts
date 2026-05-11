import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    // 1. Driver Types
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "vc_driver_type" (
        "driver_type_id" INT NOT NULL PRIMARY KEY,
        "desc" VARCHAR(50)
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO "vc_driver_type" ("driver_type_id", "desc")
      VALUES (1, 'พนักงานขับรถโดยตรง'), (2, 'พนักงาน (ทำหน้าที่ขับรถ)')
      ON CONFLICT DO NOTHING;
    `);

    // 2. Maintenance Causes
    const causes = [
      "เครื่องยนต์สตาร์ทไม่ติด",
      "เครื่องยนต์ร้อนจัด",
      "เครื่องยนต์สั่นหรือเดินไม่เรียบ",
      "น้ำมันเครื่องรั่ว",
      "แบตเตอรี่เสื่อม",
      "ไดสตาร์ทเสีย",
      "ไดชาร์จมีปัญหา",
      "แอร์ไม่เย็น",
      "ระบบไฟฟ้าขัดข้อง",
      "ไฟหน้า / ไฟท้ายเสีย",
      "เบรกมีปัญหา",
      "ผ้าเบรกหมด",
      "ช่วงล่างมีเสียงดัง",
      "โช๊คอัพเสื่อม",
      "พวงมาลัยสั่นหรือดึงข้าง",
      "ยางแตกหรือยางเสื่อม",
      "เกียร์กระตุกหรือเปลี่ยนเกียร์ผิดปกติ",
      "รถเกิดอุบัติเหตุ / เฉี่ยวชน",
      "ตัวถังหรือกระจกเสียหาย",
      "เข้าตรวจเช็คระยะและบำรุงรักษาตามกำหนด"
    ];

    console.log("Seeding maintenance causes...");
    for (const detail of causes) {
      const exists = await prisma.vc_maintenance_cause.findFirst({
        where: { cause_detail: detail }
      });
      if (!exists) {
        await prisma.vc_maintenance_cause.create({
          data: {
            cause_detail: detail,
            flag_del: 'N',
            cre_by: 'SYSTEM',
            cre_date: new Date()
          }
        });
      }
    }

    // 3. Maintenance Treats (Actions taken)
    const treats = [
      "ระบบเครื่องยนต์",
      "ระบบระบายความร้อน",
      "ระบบน้ำมันเชื้อเพลิง",
      "ระบบหล่อลื่น",
      "แบตเตอรี่",
      "ระบบสตาร์ท",
      "ระบบชาร์จไฟ (ไดชาร์จ)",
      "ระบบปรับอากาศ (แอร์)",
      "ระบบไฟฟ้า",
      "ระบบส่องสว่าง (ไฟหน้า/ท้าย)",
      "ระบบเบรก",
      "ระบบช่วงล่าง",
      "ระบบบังคับเลี้ยว (พวงมาลัย)",
      "ล้อและยาง",
      "ระบบเกียร์",
      "งานตัวถังและสี",
      "งานกระจก",
      "ตรวจเช็คตามระยะทาง (PM)",
      "งานซ่อมทั่วไป"
    ];

    console.log("Seeding maintenance treats...");
    for (const name of treats) {
      const exists = await prisma.vc_treat.findFirst({
        where: { treat_name: name }
      });
      if (!exists) {
        await prisma.vc_treat.create({
          data: {
            treat_name: name,
            flag_del: 'N',
            cre_by: 'SYSTEM',
            cre_date: new Date()
          }
        });
      }
    }

    console.log("Seeded successfully");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
