import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.vc_order_item.findMany({ 
  where: { is_regional_booking: true },
  include: {
    vc_status_use_code: true,
    vc_user: {
      include: {
        department: true
      }
    }
  }
}).then(res => {
  console.log(JSON.stringify(res, null, 2));
}).catch(console.error).finally(()=>prisma.$disconnect());
