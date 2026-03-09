import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import * as bcrypt from 'bcrypt';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    const hashedPassword = await bcrypt.hash("dev1234", 10);

    console.log('--- Seeding Data ---');

    // ── Seed Users ───────────────────────────────────────────
    const users = [
        {
            username: "dev",
            email: "dev@vcs.com", // ← แก้จาก "" เพราะ @unique จะ conflict
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

    // ── ดึง User id มาใช้ใน Booking ─────────────────────────
    const requester1 = await prisma.user.findUnique({ where: { username: "user01" } });
    const requester2 = await prisma.user.findUnique({ where: { username: "user02" } });

    if (!requester1 || !requester2) {
        throw new Error("User not found");
    }

    // ── Seed Bookings ────────────────────────────────────────
    const bookings = [
        {
            bookingNo:'REQ-2026-0001',
            requesterId: requester1.id,
            department: "ฝ่ายการตลาด",
            objective: "ประชุมร่วมกับลูกค้า",
            origin: "สำนักงานใหญ่",
            destination: "เซ็นทรัลเวิลด์",
            requestDate: new Date("2026-02-10"),
            startDateTime: new Date("2026-02-12T09:00"),
            endDateTime: new Date("2026-02-12T16:00"),
            passengerCount: 3,
            status: "PENDING" as const,
        },
        {
            bookingNo:'REQ-2026-0002',
            requesterId: requester2.id,
            department: "ฝ่ายบัญชี",
            objective: "ยื่นเอกสารกรมสรรพากร",
            origin: "สำนักงานใหญ่",
            destination: "กรมสรรพากร",
            requestDate: new Date("2026-02-10"),
            startDateTime: new Date("2026-02-13T08:30"),
            endDateTime: new Date("2026-02-13T12:00"),
            passengerCount: 1,
            status: "PENDING" as const,
        },
        {
            bookingNo:'REQ-2026-0003',
            requesterId: requester1.id,
            department: "ฝ่าย IT",
            objective: "ติดตั้งระบบสาขา",
            origin: "สำนักงานใหญ่",
            destination: "สาขาเชียงใหม่",
            requestDate: new Date("2026-02-11"),
            startDateTime: new Date("2026-02-15T07:00"),
            endDateTime: new Date("2026-02-17T18:00"),
            passengerCount: 2,
            status: "APPROVED" as const,
        },
        {
            bookingNo:'REQ-2026-0004',
            requesterId: requester2.id,
            department: "ฝ่ายบุคคล",
            objective: "อบรมพนักงานใหม่",
            origin: "สำนักงานใหญ่",
            destination: "โรงแรมมิราเคิล",
            requestDate: new Date("2026-02-11"),
            startDateTime: new Date("2026-02-14T08:00"),
            endDateTime: new Date("2026-02-14T17:00"),
            passengerCount: 5,
            status: "REJECTED" as const,
            rejectReason: "รถไม่ว่างในช่วงเวลาดังกล่าว",
        },
        {
            bookingNo:'REQ-2026-0005',
            requesterId: requester1.id,
            department: "ฝ่ายขาย",
            objective: "เยี่ยมลูกค้าต่างจังหวัด",
            origin: "สำนักงานใหญ่",
            destination: "จังหวัดระยอง",
            requestDate: new Date("2026-02-12"),
            startDateTime: new Date("2026-02-16T06:00"),
            endDateTime: new Date("2026-02-18T20:00"),
            passengerCount: 4,
            status: "PENDING" as const,
        },
    ];

    for (const booking of bookings) {
        await prisma.booking.create({ data: booking });
        console.log(`Booking created: ${booking.destination}`);
    }

    console.log('--- Seeding Done ---');
}

main()
    .then(async () => await prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });