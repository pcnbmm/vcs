const { PrismaClient } = require('./prisma/generated/prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Attempt to create types, ignore errors if they exist
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

    console.log("Seeded successfully");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
