import { Injectable } from '@nestjs/common';
import { ModerationAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramApiService } from '../telegram/telegram-api.service';

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService, private readonly telegramApi: TelegramApiService) {}

  async list() {
    return this.prisma.moderationEvent.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async apply(data: { channelId?: string; actorUserId?: string; chatId: string; targetTelegramId: string; messageId?: number; action: ModerationAction; reason?: string }) {
    if (data.action === 'DELETE' && data.messageId) await this.telegramApi.deleteMessage(data.chatId, data.messageId);
    if (data.action === 'MUTE') await this.telegramApi.restrictChatMember(data.chatId, data.targetTelegramId, Math.floor(Date.now() / 1000) + 3600);
    if (data.action === 'BAN') await this.telegramApi.banChatMember(data.chatId, data.targetTelegramId);
    return this.prisma.moderationEvent.create({
      data: {
        channelId: data.channelId,
        actorUserId: data.actorUserId,
        targetTelegramId: BigInt(data.targetTelegramId),
        messageId: data.messageId ? BigInt(data.messageId) : undefined,
        action: data.action,
        reason: data.reason,
      },
    });
  }

  async applyEscalation(data: { channelId?: string; actorUserId?: string; chatId: string; targetTelegramId: string; reason?: string }) {
    const count = await this.prisma.moderationEvent.count({ where: { targetTelegramId: BigInt(data.targetTelegramId) } });
    const action: ModerationAction = count === 0 ? 'WARN' : count === 1 ? 'MUTE' : 'BAN';
    return this.apply({ ...data, action });
  }
}
