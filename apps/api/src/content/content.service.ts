import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { WatermarkService } from './watermark.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { QueuesService } from '../queues/queues.service';
import { TelegramApiService } from '../telegram/telegram-api.service';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly watermarkService: WatermarkService,
    private readonly audit: AuditService,
    private readonly queues: QueuesService,
    private readonly telegramApi: TelegramApiService,
  ) {}

  async list(query?: PaginationDto) {
    try {
      const page = query?.page || 1;
      const limit = query?.limit || 20;
      const skip = (page - 1) * limit;
      const where = {
        deletedAt: null,
        ...(query?.q ? { OR: [{ title: { contains: query.q, mode: 'insensitive' as const } }, { body: { contains: query.q, mode: 'insensitive' as const } }] } : {}),
      };
      const [items, total] = await Promise.all([
        this.prisma.contentItem.findMany({ include: { channel: true }, where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        this.prisma.contentItem.count({ where }),
      ]);
      return { items, total, page, limit };
    } catch (e: any) {
      this.logger.warn(`list failed: ${e.message}`);
      return { items: [], total: 0, page: 1, limit: 20 };
    }
  }

  async create(data: { title?: string; body?: string; channelId?: string; mediaType?: any; mediaFileId?: string; pollQuestion?: string; pollOptions?: string[]; watermarkText?: string; }) {
    try {
      const isPoll = data.pollQuestion && data.pollOptions && data.pollOptions.length >= 2;
      const item = await this.prisma.contentItem.create({
        data: {
          title: data.title,
          body: data.body,
          channelId: data.channelId,
          mediaType: isPoll ? 'POLL' : (data.mediaType as any) || 'TEXT',
          mediaFileId: data.mediaFileId,
          pollQuestion: data.pollQuestion,
          pollOptions: data.pollOptions as any,
          watermarkText: data.watermarkText || process.env.DEFAULT_WATERMARK_TEXT || 'СВОЙ',
          status: 'DRAFT',
        },
      });
      await this.audit.log({ action: 'CONTENT_CREATE', entityType: 'ContentItem', entityId: item.id, payloadJson: data }).catch(()=>{});
      return item;
    } catch (e: any) {
      throw new BadRequestException(`Ошибка создания: ${e.message}`);
    }
  }

  async update(id: string, data: { title?: string; body?: string; channelId?: string; watermarkText?: string; status?: ContentStatus; scheduledFor?: string; moderationComment?: string; pollQuestion?: string; pollOptions?: any; }) {
    try {
      const item = await this.prisma.contentItem.update({
        where: { id },
        data: {
          title: data.title,
          body: data.body,
          channelId: data.channelId,
          watermarkText: data.watermarkText,
          status: data.status as any,
          scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
          moderationComment: data.moderationComment,
          pollQuestion: data.pollQuestion,
          pollOptions: data.pollOptions,
        },
      });
      await this.audit.log({ action: 'CONTENT_UPDATE', entityType: 'ContentItem', entityId: id, payloadJson: data }).catch(()=>{});
      return item;
    } catch (e: any) {
      throw new BadRequestException(`Ошибка обновления: ${e.message}`);
    }
  }

  async rewrite(id: string) {
    try {
      const item = await this.prisma.contentItem.findUnique({ where: { id } });
      if (!item) return null;
      const aiRewrittenText = await this.aiService.rewriteText(item.body || '');
      const updated = await this.prisma.contentItem.update({ where: { id }, data: { aiRewrittenText } });
      await this.audit.log({ action: 'CONTENT_REWRITE', entityType: 'ContentItem', entityId: id }).catch(()=>{});
      return updated;
    } catch (e: any) {
      throw new BadRequestException(`AI ошибка: ${e.message}`);
    }
  }

  async approve(id: string) {
    try {
      const updated = await this.prisma.contentItem.update({ where: { id }, data: { status: 'APPROVED' } });
      await this.audit.log({ action: 'CONTENT_APPROVE', entityType: 'ContentItem', entityId: id }).catch(()=>{});
      return updated;
    } catch (e: any) { throw new BadRequestException(e.message); }
  }

  async schedule(id: string, scheduledFor: string) {
    try {
      const date = new Date(scheduledFor);
      const updated = await this.prisma.contentItem.update({ where: { id }, data: { status: 'SCHEDULED', scheduledFor: date } });
      await this.queues.enqueue('publishing', 'publish-content', { contentItemId: id }, Math.max(0, date.getTime() - Date.now())).catch(()=>{});
      await this.audit.log({ action: 'CONTENT_SCHEDULE', entityType: 'ContentItem', entityId: id, payloadJson: { scheduledFor } }).catch(()=>{});
      return updated;
    } catch (e: any) { throw new BadRequestException(e.message); }
  }

  async publishNow(id: string) {
    try {
      const item = await this.prisma.contentItem.findUnique({ where: { id }, include: { channel: true } });
      if (!item) throw new BadRequestException('Пост не найден');
      if (!item.channel?.telegramId) throw new BadRequestException('У канала нет Telegram ID. Укажи в настройках канала.');

      const chatId = item.channel.telegramId.toString();
      const text = item.aiRewrittenText || item.body || item.title || 'СВОЙ';
      let result: any;

      try {
        if (item.mediaType === 'POLL' && item.pollQuestion && item.pollOptions) {
          const options = Array.isArray(item.pollOptions) ? item.pollOptions : JSON.parse(item.pollOptions as any);
          result = await this.telegramApi.sendPoll(chatId, item.pollQuestion, options, item.isAnonymousPoll ?? true);
        } else if (item.mediaType === 'PHOTO' && (item.processedMediaPath || item.localMediaPath || item.mediaFileId)) {
          result = await this.telegramApi.sendPhoto(chatId, item.processedMediaPath || item.localMediaPath || item.mediaFileId!, text);
        } else if (item.mediaType === 'VIDEO' && (item.processedMediaPath || item.localMediaPath || item.mediaFileId)) {
          result = await this.telegramApi.sendVideo(chatId, item.processedMediaPath || item.localMediaPath || item.mediaFileId!, text);
        } else {
          result = await this.telegramApi.sendMessage(chatId, text);
        }
      } catch (tgErr: any) {
        const desc = tgErr.response?.data?.description || tgErr.message;
        throw new BadRequestException(`Telegram ошибка: ${desc}. Проверь что @${process.env.MASTER_BOT_USERNAME} админ в канале ${item.channel.title} (${chatId})`);
      }

      const updated = await this.prisma.contentItem.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedMessageId: result?.message_id ? BigInt(result.message_id) : undefined,
          viewsCount: 0,
        },
      });
      await this.audit.log({ action: 'CONTENT_PUBLISH_NOW', entityType: 'ContentItem', entityId: id }).catch(()=>{});
      return updated;
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException(e.message);
    }
  }

  async processWatermark(id: string) {
    try {
      const item = await this.prisma.contentItem.findUnique({ where: { id } });
      if (!item?.localMediaPath || !item.mediaType) return null;
      const watermarkText = item.watermarkText || process.env.DEFAULT_WATERMARK_TEXT || 'СВОЙ';
      const result = item.mediaType === 'PHOTO'
        ? await this.watermarkService.processImage(item.localMediaPath, watermarkText)
        : item.mediaType === 'VIDEO'
        ? await this.watermarkService.processVideo(item.localMediaPath, watermarkText)
        : null;
      if (!result) return null;
      const updated = await this.prisma.contentItem.update({ where: { id }, data: { processedMediaPath: result.outPath } });
      await this.audit.log({ action: 'CONTENT_WATERMARK', entityType: 'ContentItem', entityId: id }).catch(()=>{});
      return updated;
    } catch (e: any) { throw new BadRequestException(e.message); }
  }

  async softDelete(id: string) {
    try {
      const updated = await this.prisma.contentItem.update({ where: { id }, data: { deletedAt: new Date() } });
      await this.audit.log({ action: 'CONTENT_SOFT_DELETE', entityType: 'ContentItem', entityId: id }).catch(()=>{});
      return updated;
    } catch (e: any) { throw new BadRequestException(e.message); }
  }

  async registerChannelPost(channelPost: any) {
    try {
      return await this.prisma.contentItem.create({
        data: {
          title: channelPost.chat?.title,
          body: channelPost.text || channelPost.caption,
          mediaFileId: channelPost.photo?.length ? channelPost.photo[channelPost.photo.length - 1].file_id : channelPost.video?.file_id,
          mediaType: channelPost.video ? 'VIDEO' : channelPost.photo?.length ? 'PHOTO' : 'TEXT',
          status: 'PUBLISHED',
          publishedMessageId: channelPost.message_id ? BigInt(channelPost.message_id) : undefined,
        },
      });
    } catch (e: any) {
      this.logger.warn(`registerChannelPost failed: ${e.message}`);
      return null;
    }
  }
}
