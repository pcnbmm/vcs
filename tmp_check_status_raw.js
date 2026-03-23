
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const statuses = await prisma.$queryRaw`SELECT * FROM vc_status_use_code`;
        console.log(JSON.stringify(statuses, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
