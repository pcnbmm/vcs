import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const orgs = await prisma.vc_orgs.findMany({
        where: { orgname: { contains: 'ส่วนบริการยานพาหนะ' } }
    });
    console.log("Orgs containing 'ส่วนบริการยานพาหนะ':", orgs);

    const checkAllOrgs = await prisma.vc_orgs.findMany({
        take: 5
    });
    console.log("Some orgs:", checkAllOrgs);
    
    // Check cars belonging to this org
    if (orgs.length > 0) {
        const orgId = orgs[0].orgid;
        const cars = await prisma.vc_car_master.findMany({
            where: { own_div_code: orgId },
            include: { vc_car_spec: true }
        });
        console.log(`Cars belonging to ${orgId}:`, cars.length);
        
        // Output distinct car specs for this org
        const specIds = new Set(cars.map(c => c.car_spec_id));
        console.log("Car spec IDs for this org:", Array.from(specIds));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
