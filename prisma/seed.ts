import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import * as bcrypt from 'bcrypt';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("dev1234", 10) // รหัสเริ่มต้น

  console.log('--- Seeding Data ---')

    const users = [
        {
            username: "dev",
            email: "dev@vcs.com",
            name: "Dev",
            password: hashedPassword,
            role: "DEV"
        },
        {
            username: "user01",
            email: "user01@vcs.com",
            name: "นาย สมชาย ใจดี",
            password: hashedPassword,
            role: "USER"
        },
        {
            username: "user02",
            email: "user02@vcs.com",
            name: "นางสาว วิภา รักงาน",
            password: hashedPassword,
            role: "USER"
        },
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { username: u.username },
            update: { password: u.password, email: u.email, name: u.name, role: u.role },
            create: u,
        });
        console.log(`User created: ${u.username}`);
    }
  ]

    console.log('--- Seeding Done ---');
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })