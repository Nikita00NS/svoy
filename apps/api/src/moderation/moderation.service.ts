import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ModerationAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramApiService } from '../telegram/telegram-api.service';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  constructor(private readonly prisma: PrismaService, private readonly telegramApi: TelegramApiService) {}

  async list() {
    try { return await this.prisma.moderationEvent.findMany({ orderBy: { createdAt: 'desc' } }); }
    catch (e: any) { this.logger.warn(`list failed: ${e.message}`); return []; }
  }

  async apply(data: { channelId?: string; actorUserId?: string; chatId: string; targetTelegramId: string; messageId?: number; action: ModerationAction; reason?: string }) {
    try {
      if (data.action === 'DELETE' && data.messageId) {
        try { await this.telegramApi.deleteMessage(data.chatId, data.messageId); } catch {}
      }
      if (data.action === 'MUTE') {
        try { await this.telegramApi.restrictChatMember(data.chatId, data.targetTelegramId, Math.floor(Date.now() / 1000) + 3600); } catch {}
      }
      if (data.action === 'BAN') {
        try { await this.telegramApi.banChatMember(data.chatId, data.targetTelegramId); } catch {}
      }
      return await this.prisma.moderationEvent.create({
        data: {
          channelId: data.channelId,
          actorUserId: data.actorUserId,
          targetTelegramId: BigInt(data.targetTelegramId),
          messageId: data.messageId ? BigInt(data.messageId) : undefined,
          action: data.action,
          reason: data.reason,
        },
      });
    } catch (e: any) {
      this.logger.error(`apply failed: ${e.message}`);
      throw new BadRequestException(`Модерация ошибка: ${e.message}`);
    }
  }

  async applyEscalation(data: { channelId?: string; actorUserId?: string; chatId: string; targetTelegramId: string; reason?: string }) {
    try {
      const count = await this.prisma.moderationEvent.count({ where: { targetTelegramId: BigInt(data.targetTelegramId) } });
      const action: ModerationAction = count === 0 ? 'WARN' : count === 1 ? 'MUTE' : 'BAN';
      return await this.apply({ ...data, action });
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
