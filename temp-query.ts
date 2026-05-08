import { prisma } from "./src/lib/prisma";

async function main() {
  const roles = await prisma.vc_roles.findMany({
    include: {
      vc_menu_role: {
        include: {
          vc_menu: true
        }
      }
    }
  });

  const menuOrder: { [key: string]: number } = {
    "อนุมัติคำขอ": 10,
    "จัดรถ": 20,
    "คืนรถ": 30,
    "ขอเร่งด่วน": 40,
    "ขอใช้รถ": 50,
    "ขอใช้งานรถยนต์": 51,
    "ติดตามคำขอ": 60,
    "จัดการรถทดแทน": 70,
    "รายงาน": 80,
    "ข้อมูลรถและคนขับ": 90,
    "จัดการสิทธิ์": 100,
  };

  for (const role of roles) {
    const menus = new Map();
    for (const mr of role.vc_menu_role) {
      if (mr.vc_menu) {
        menus.set(mr.vc_menu.menu_id, mr.vc_menu.menuname);
      }
    }
    const sorted = Array.from(menus.values()).sort((a, b) => {
      const weightA = menuOrder[a] || 999;
      const weightB = menuOrder[b] || 999;
      return weightA - weightB;
    });
    console.log(`Role: ${role.roles_name} (ID: ${role.roles_id})`);
    console.log(sorted.map((m, i) => `${i + 1}. ${m}`).join("\n"));
    console.log("");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
