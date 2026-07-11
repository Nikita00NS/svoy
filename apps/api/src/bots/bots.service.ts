import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramApiService } from '../telegram/telegram-api.service';

@Injectable()
export class BotsService {
  private readonly logger = new Logger(BotsService.name);
  constructor(private readonly prisma: PrismaService, private readonly telegramApi: TelegramApiService) {}

  async list() {
    try { return await this.prisma.bot.findMany({ orderBy: { createdAt: 'desc' } }); }
    catch (e: any) { this.logger.error(`list failed: ${e.message}`); return []; }
  }

  async create(data: { username: string; tokenRef: string; webhookPath: string; internalKey: string; isMaster?: boolean }) {
    try {
      const cleanUsername = data.username.replace(/^@/, '').trim();
      return await this.prisma.bot.create({ data: { ...data, username: cleanUsername } });
    } catch (e: any) {
      if (e.code === 'P2002') throw new BadRequestException('Бот с таким username/webhook уже есть');
      throw new BadRequestException(`Ошибка создания бота: ${e.message}`);
    }
  }

  async setupMasterWebhook() {
    try {
      const botKey = process.env.MASTER_BOT_KEY || 'master';
      const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/telegram/webhook/${botKey}`;
      await this.telegramApi.setWebhook(webhookUrl, process.env.WEBHOOK_SECRET);
      return await this.prisma.bot.upsert({
        where: { internalKey: botKey },
        update: {
          username: (process.env.MASTER_BOT_USERNAME || 'master_bot').replace(/^@/, ''),
          tokenRef: 'env:MASTER_BOT_TOKEN',
          webhookPath: `/telegram/webhook/${botKey}`,
          isMaster: true,
          isActive: true,
          deletedAt: null,
        },
        create: {
          username: (process.env.MASTER_BOT_USERNAME || 'master_bot').replace(/^@/, ''),
          tokenRef: 'env:MASTER_BOT_TOKEN',
          webhookPath: `/telegram/webhook/${botKey}`,
          internalKey: botKey,
          isMaster: true,
          isActive: true,
        },
      });
    } catch (e: any) {
      this.logger.error(`setupMasterWebhook failed: ${e.message}`, e.stack);
      throw new BadRequestException(`Webhook ошибка: ${e.message}`);
    }
  }
}
