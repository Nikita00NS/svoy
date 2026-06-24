import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async checkMessage(channelId: number, text: string): Promise<{ action: string; reason: string; ruleId?: number }> {
    const rules = await this.prisma.moderationRule.findMany({
      where: {
        isActive: true,
        OR: [{ scope: 'GLOBAL' }, { channelId }],
      },
    });

    for (const rule of rules) {
      try {
        const regex = new RegExp(rule.pattern, 'iu');
        if (regex.test(text)) {
          return {
            action: rule.action,
            reason: rule.category,
            ruleId: rule.id,
          };
        }
      } catch (e) {
        console.error('Invalid regex:', rule.pattern);
      }
    }

    return { action: 'ALLOW', reason: 'clean' };
  }

  async applyViolation(channelId: number, chatId: number, telegramUserId: bigint, verdict: any) {
    const warning = await this.prisma.userWarning.upsert({
      where: { channelId_telegramUserId: { channelId, telegramUserId } },
      update: { count: { increment: 1 }, lastReason: verdict.reason },
      create: { channelId, telegramUserId, count: 1, lastReason: verdict.reason },
    });

    let eventType: any = 'WARN';
    if (warning.count >= 3) eventType = 'BAN';
    else if (warning.count >= 2) eventType = 'MUTE';

    await this.prisma.moderationEvent.create({
      data: {
        channelId,
        chatId,
        targetTelegramUserId: telegramUserId,
        actorType: 'BOT',
        eventType,
        reason: verdict.reason,
        expiresAt: eventType === 'MUTE' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
      },
    });

    return { eventType, count: warning.count };
  }
}
