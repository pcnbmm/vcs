import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const menus = await prisma.vc_menu.findMany()
  console.log(JSON.stringify(menus, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
