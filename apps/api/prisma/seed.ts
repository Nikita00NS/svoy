import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ownerId = process.env.OWNER_TELEGRAM_ID || '7320418026';
  await prisma.user.upsert({
    where: { telegramUserId: BigInt(ownerId) },
    update: { role: 'OWNER' },
    create: {
      telegramUserId: BigInt(ownerId),
      role: 'OWNER',
      username: 'owner',
      firstName: 'Owner',
    },
  });
}

main().finally(async () => prisma.$disconnect());
