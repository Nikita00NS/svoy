import { Injectable, Logger } from '@nestjs/common';
import { ContentType, IntakeStatus, IntakeType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramApiService } from '../telegram/telegram-api.service';

@Injectable()
export class IntakesService {
  private readonly logger = new Logger(IntakesService.name);
  constructor(private readonly prisma: PrismaService, private readonly telegramApi: TelegramApiService) {}

  async createIntake(data: {
    type: IntakeType;
    telegramChatId: bigint;
    telegramMessageId?: bigint;
    text?: string;
    title?: string;
    mediaFileId?: string;
    mediaType?: ContentType;
    telegramUser?: { id: bigint; username?: string; firstName?: string; lastName?: string };
    extraJson?: Prisma.InputJsonValue;
  }) {
    try {
      let userId: string | undefined;
      if (data.telegramUser) {
        const user = await this.prisma.user.upsert({
          where: { telegramUserId: data.telegramUser.id },
          update: { username: data.telegramUser.username, firstName: data.telegramUser.firstName, lastName: data.telegramUser.lastName },
          create: { telegramUserId: data.telegramUser.id, username: data.telegramUser.username, firstName: data.telegramUser.firstName, lastName: data.telegramUser.lastName },
        });
        userId = user.id;
      }
      const intake = await this.prisma.intakeRequest.create({
        data: {
          type: data.type,
          telegramChatId: data.telegramChatId,
          telegramMessageId: data.telegramMessageId,
          title: data.title,
          text: data.text,
          mediaFileId: data.mediaFileId,
          mediaType: data.mediaType,
          extraJson: data.extraJson,
          userId,
        },
        include: { user: true },
      });
      try {
        if (intake.type === 'AD_ORDER') await this.prisma.adOrder.create({ data: { intakeRequestId: intake.id } });
        if (intake.type === 'APPEAL') await this.prisma.appeal.create({ data: { intakeRequestId: intake.id } });
        if (intake.type === 'JOB_APPLICATION') await this.prisma.jobApplication.create({ data: { intakeRequestId: intake.id, resumeText: intake.text } });
        if (intake.type === 'SUPPORT') await this.prisma.supportThread.create({ data: { intakeRequestId: intake.id, ownerId: userId } });
        if (intake.type === 'NEWS_PROPOSAL') {
          await this.prisma.contentItem.create({
            data: {
              sourceRequestId: intake.id,
              title: intake.title,
              body: intake.text,
              mediaFileId: intake.mediaFileId,
              mediaType: intake.mediaType,
              status: 'PENDING_REVIEW',
              watermarkText: process.env.DEFAULT_WATERMARK_TEXT || 'СВОЙ',
            },
          });
        }
      } catch (e: any) { this.logger.warn(`secondary create failed: ${e.message}`); }
      return intake;
    } catch (e: any) {
      this.logger.error(`createIntake failed: ${e.message}`);
      throw e;
    }
  }

  async listAll() {
    try {
      return await this.prisma.intakeRequest.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
    } catch (e: any) {
      this.logger.warn(`listAll failed: ${e.message}`);
      return [];
    }
  }

  async listPaginated(query?: any) {
    try {
      const page = Number(query?.page) || 1;
      const limit = Number(query?.limit) || 50;
      const skip = (page - 1) * limit;
      const items = await this.prisma.intakeRequest.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });
      const total = await this.prisma.intakeRequest.count();
      return { items, total, page, limit };
    } catch (e: any) {
      this.logger.warn(`listPaginated failed: ${e.message}`);
      return { items: [], total: 0, page: 1, limit: 50 };
    }
  }

  async updateStatus(id: string, status: IntakeStatus) {
    return this.updateStatusFull(id, status);
  }

  async updateStatusFull(id: string, status: IntakeStatus, moderatorComment?: string, contentItemId?: string) {
    try {
      const intake = await this.prisma.intakeRequest.update({
        where: { id },
        data: {
          status,
          moderatorComment: moderatorComment ?? undefined,
          contentItemId: contentItemId ?? undefined,
        },
        include: { user: true },
      });

      // Уведомить пользователя в ТГ о смене статуса (чтобы видел статус и коммент модератора)
      try {
        const statusText: Record<string, string> = {
          NEW: '🆕 Новая заявка',
          IN_REVIEW: '👀 На рассмотрении',
          APPROVED: '✅ Одобрена',
          REJECTED: '❌ Отклонена',
          CLOSED: '📦 Закрыта',
        };
        let msg = `${statusText[status] || status}\n\n`;
        if (intake.type) msg += `Тип: ${intake.type}\n`;
        if (moderatorComment) msg += `Комментарий модератора: ${moderatorComment}\n`;
        if (status === 'APPROVED' && intake.type === 'AD_ORDER') msg += `\nВаша реклама принята! Менеджер свяжется с вами.`;
        if (status === 'APPROVED' && intake.type === 'NEWS_PROPOSAL') msg += `\nВаша новость одобрена и пойдет в публикацию!`;

        await this.telegramApi.sendMessage(intake.telegramChatId.toString(), msg);
      } catch (e: any) {
        this.logger.warn(`notify intake ${id} failed: ${e.message}`);
      }

      return intake;
    } catch (e: any) {
      this.logger.error(`updateStatusFull failed: ${e.message}`);
      throw e;
    }
  }

  async updateComment(id: string, moderatorComment: string) {
    try {
      return await this.prisma.intakeRequest.update({ where: { id }, data: { moderatorComment } });
    } catch (e: any) {
      this.logger.error(`updateComment failed: ${e.message}`);
      throw e;
    }
  }
}
