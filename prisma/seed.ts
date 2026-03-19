import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import * as bcrypt from "bcrypt";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("dev1234", 10); // รหัสเริ่มต้น

  console.log("--- Seeding Data ---");

  const users = [
    {
      username: "dev01",
      username2: hashedPassword,
      firstname: "dev",
      lastname: "dev",
      bname: "dev",
      usertype: "DEV",
      email: "dev01@vcs.com",
    },
  ];

  for (const u of users) {
    await prisma.vc_users.upsert({
      where: { userid: 0 }, // ← userid เป็น autoincrement ใช้ username แทน
      update: { username2: u.username2 },
      create: u,
    });
    console.log(`User created: ${u.username}`);
  }

  console.log("--- Seeding Done ---");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
