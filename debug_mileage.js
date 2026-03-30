const { PrismaClient } = require("./prisma/generated/prisma/client");
const prisma = new PrismaClient();

async function main() {
  const car = await prisma.vc_car_master.findFirst({
    where: { car_number: "2กว9764" }
  });
  console.log("CAR:", JSON.stringify(car));

  if (car) {
    const latestUses = await prisma.vc_use.findMany({
      where: { car_id: car.car_id },
      orderBy: { use_id: "desc" },
      take: 5
    });
    console.log("LATEST USES FOR CAR:", JSON.stringify(latestUses));
  }

  const order = await prisma.vc_order_item.findFirst({
    where: { request_id: 81 } // REQ-0081
  });
  console.log("ORDER REQ-0081:", JSON.stringify(order));
}

main().finally(() => prisma.$disconnect());
