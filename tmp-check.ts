import { prisma } from './src/lib/prisma';
async function main() {
  const badBrands = await prisma.$queryRawUnsafe('SELECT m.car_id, m.car_brand_id FROM vc_car_master m LEFT JOIN vc_car_brand b ON m.car_brand_id = b.car_brand_id WHERE m.car_brand_id IS NOT NULL AND b.car_brand_id IS NULL LIMIT 5');
  console.log('Bad Brands:', badBrands);
  
  const badColors = await prisma.$queryRawUnsafe('SELECT m.car_id, m.color_id FROM vc_car_master m LEFT JOIN vc_color c ON m.color_id = c.color_id WHERE m.color_id IS NOT NULL AND c.color_id IS NULL LIMIT 5');
  console.log('Bad Colors:', badColors);
  
  const badStatus = await prisma.$queryRawUnsafe('SELECT m.car_id, m.car_status_id FROM vc_car_master m LEFT JOIN vc_car_status s ON m.car_status_id = s.car_status_id WHERE m.car_status_id IS NOT NULL AND s.car_status_id IS NULL LIMIT 5');
  console.log('Bad Status:', badStatus);
  
  await prisma.$disconnect();
}
main();
