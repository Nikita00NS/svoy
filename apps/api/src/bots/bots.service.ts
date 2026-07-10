import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramApiService } from '../telegram/telegram-api.service';

@Injectable()
export class BotsService {
  constructor(private readonly prisma: PrismaService, private readonly telegramApi: TelegramApiService) {}

  list() {
    return this.prisma.bot.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: { username: string; tokenRef: string; webhookPath: string; internalKey: string; isMaster?: boolean }) {
    return this.prisma.bot.create({ data });
  }

  async setupMasterWebhook() {
    const botKey = process.env.MASTER_BOT_KEY || 'master';
    const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/telegram/webhook/${botKey}`;
    await this.telegramApi.setWebhook(webhookUrl, process.env.WEBHOOK_SECRET);
    return this.prisma.bot.upsert({
      where: { internalKey: botKey },
      update: {
        username: process.env.MASTER_BOT_USERNAME || 'master_bot',
        tokenRef: 'env:MASTER_BOT_TOKEN',
        webhookPath: `/telegram/webhook/${botKey}`,
        isMaster: true,
        isActive: true,
      },
      create: {
        username: process.env.MASTER_BOT_USERNAME || 'master_bot',
        tokenRef: 'env:MASTER_BOT_TOKEN',
        webhookPath: `/telegram/webhook/${botKey}`,
        internalKey: botKey,
        isMaster: true,
        isActive: true,
      },
    });
  }
}
