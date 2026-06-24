import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create OWNER user
  const owner = await prisma.user.upsert({
    where: { telegramUserId: BigInt(process.env.SEED_OWNER_TG_ID || '7320418026') },
    update: {},
    create: {
      telegramUserId: BigInt(process.env.SEED_OWNER_TG_ID || '7320418026'),
      username: 'owner',
      firstName: 'Owner',
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created OWNER user:', owner.telegramUserId);

  // Create default channel
  const channel = await prisma.channel.upsert({
    where: { handle: 'svoy_moscow' },
    update: {},
    create: {
      title: 'СВОЙ | Москва',
      handle: 'svoy_moscow',
      type: 'CITY',
      city: 'Москва',
      description: 'Официальный канал «СВОЙ» — Москва',
      signatureText: 'СВОЙ',
      moderationMode: 'HYBRID',
      isActive: true,
    },
  });
  console.log('✅ Created channel:', channel.handle);

  // Create master bot
  const bot = await prisma.bot.upsert({
    where: { username: process.env.TELEGRAM_BOT_USERNAME || 'svoy_master_bot' },
    update: {},
    create: {
      name: 'СВОЙ Master Bot',
      username: process.env.TELEGRAM_BOT_USERNAME || 'svoy_master_bot',
      telegramBotId: BigInt('8980998631'),
      tokenRef: 'TELEGRAM_BOT_TOKEN',
      isMaster: true,
      webhookPath: 'master',
      isActive: true,
    },
  });
  console.log('✅ Created master bot');

  // Create moderation rules
  const rules = [
    { category: 'PROFANITY', pattern: '(ху[йяи]|бля|пизд|еб[ау])', action: 'WARN' as const },
    { category: 'CASINO', pattern: '(казино|ставки|1xbet|pin-?up)', action: 'DELETE' as const },
    { category: 'CRYPTO', pattern: '(crypto scam|гарант.*крипт|удвоим.*usdt)', action: 'DELETE' as const },
    { category: 'SPAM', pattern: '(https?:\\/\\/\\S+.*){3,}|(.)\\1{15,}', action: 'DELETE' as const },
    { category: 'TOXIC', pattern: '(убью|сдохни|мразь)', action: 'WARN' as const },
    { category: 'PERSONAL_DATA', pattern: '(\\+7\\d{10}|\\b\\d{4} \\d{4} \\d{4} \\d{4}\\b)', action: 'MANUAL_REVIEW' as const },
  ];

  for (const rule of rules) {
    await prisma.moderationRule.upsert({
      where: {
        id: 0, // Will be ignored for create
      },
      update: {},
      create: {
        scope: 'GLOBAL',
        category: rule.category,
        pattern: rule.pattern,
        action: rule.action,
        isActive: true,
      },
    });
  }
  console.log('✅ Created 6 moderation rules');

  // Create global sensitive_regions setting
  await prisma.setting.upsert({
    where: {
      scope_scopeId_key: {
        scope: 'GLOBAL',
        scopeId: null,
        key: 'sensitive_regions',
      },
    },
    update: {},
    create: {
      scope: 'GLOBAL',
      key: 'sensitive_regions',
      value: ['Белгород', 'Курск', 'Брянск', 'Донецк', 'Луганск'],
    },
  });
  console.log('✅ Created sensitive_regions setting');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
