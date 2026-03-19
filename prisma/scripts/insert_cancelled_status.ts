import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.vc_status_use_code.upsert({
        where: { status_use_id: 6 },
        update: { status_use_name: 'cancelled' },
        create: {
            status_use_id: 6,
            status_use_name: 'cancelled',
        },
    });
    console.log('✅ Inserted status ID 6 = cancelled');
}

main()
    .then(async () => await prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
