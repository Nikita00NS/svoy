import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { WatermarkService } from './watermark.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { QueuesService } from '../queues/queues.service';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly watermarkService: WatermarkService,
    private readonly audit: AuditService,
    private readonly queues: QueuesService,
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

  async update(id: string, data: { title?: string; body?: string; channelId?: string; watermarkText?: string; status?: ContentStatus; scheduledFor?: string }) {
    try {
      const item = await this.prisma.contentItem.update({
        where: { id },
        data: {
          title: data.title,
          body: data.body,
          channelId: data.channelId,
          watermarkText: data.watermarkText,
          status: data.status,
          scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
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
      const updated = await this.prisma.contentItem.update({ where: { id }, data: { status: 'SCHEDULED', scheduledFor: new Date() } });
      await this.queues.enqueue('publishing', 'publish-content', { contentItemId: id }, 0).catch(()=>{});
      await this.audit.log({ action: 'CONTENT_PUBLISH_NOW', entityType: 'ContentItem', entityId: id }).catch(()=>{});
      return updated;
    } catch (e: any) { throw new BadRequestException(e.message); }
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
