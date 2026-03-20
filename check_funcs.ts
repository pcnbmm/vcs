import { prisma } from './src/lib/prisma';

async function main() {
  const funcs = await prisma.vc_function.findMany();
  console.log("Functions in DB:");
  funcs.forEach(f => console.log(f.function_id, f.func_name));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
