import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // No-op seed for now
}

main().finally(() => prisma.$disconnect())


