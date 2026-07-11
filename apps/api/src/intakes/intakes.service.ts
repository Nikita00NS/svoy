import { Injectable, Logger } from '@nestjs/common';
import { ContentType, IntakeStatus, IntakeType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntakesService {
  private readonly logger = new Logger(IntakesService.name);
  constructor(private readonly prisma: PrismaService) {}

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

  async updateStatus(id: string, status: IntakeStatus) {
    try {
      return await this.prisma.intakeRequest.update({ where: { id }, data: { status } });
    } catch (e: any) {
      this.logger.error(`updateStatus failed: ${e.message}`);
      throw e;
    }
  }
}
