const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const types = await prisma.vc_car_type.findMany();
  console.log('Car Types:', JSON.stringify(types, null, 2));
  
  const status = await prisma.vc_car_status.findMany();
  console.log('Car Statuses:', JSON.stringify(status, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
