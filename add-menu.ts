import { prisma } from "./src/lib/prisma";

async function main() {
  let menu = await prisma.vc_menu.findFirst({
    where: { route_path: "/maintenance" }
  });

  if (!menu) {
    console.log("Creating /maintenance menu...");
    menu = await prisma.vc_menu.create({
      data: {
        menuname: "แจ้งซ่อมรถเสีย",
        route_path: "/maintenance",
      }
    });
    console.log("Created menu:", menu);
  } else {
    console.log("Menu already exists:", menu);
  }

  // Use raw SQL to insert to avoid complex relational inputs if not perfectly mapped
  const exists = await prisma.$queryRaw`SELECT * FROM vc_menu_role WHERE menu_id = ${menu.menu_id} AND roles_id = 3`;
  
  if (Array.isArray(exists) && exists.length === 0) {
    console.log("Linking menu to admin role...");
    await prisma.$executeRaw`INSERT INTO vc_menu_role (menu_id, roles_id) VALUES (${menu.menu_id}, 3)`;
    console.log("Linked successfully.");
  } else {
    console.log("Link already exists.");
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
