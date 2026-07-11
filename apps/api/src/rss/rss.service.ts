import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Parser = require('rss-parser');
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class RssService {
  private readonly logger = new Logger(RssService.name);
  private parser: Parser;

  constructor(private readonly prisma: PrismaService, private readonly ai: AiService) {
    this.parser = new Parser();
  }

  async list() {
    try {
      return await this.prisma.rssSource.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });
    } catch (e: any) {
      this.logger.warn(`list failed: ${e.message}`);
      return [];
    }
  }

  async create(data: { title: string; url: string; isActive?: boolean; channelId?: string; autoPublish?: boolean }) {
    try {
      return await this.prisma.rssSource.create({
        data: {
          title: data.title.trim(),
          url: data.url.trim(),
          isActive: data.isActive ?? true,
          channelId: data.channelId || null,
          autoPublish: data.autoPublish ?? false,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new BadRequestException('RSS с таким URL уже есть');
      throw new BadRequestException(`Ошибка: ${e.message}`);
    }
  }

  async fetchNow(id: string) {
    try {
      const source = await this.prisma.rssSource.findUnique({ where: { id } });
      if (!source) throw new BadRequestException('Источник не найден');
      const feed = await this.parser.parseURL(source.url);
      const created: string[] = [];
      for (const item of feed.items.slice(0, 10)) {
        try {
          let body = item.contentSnippet || item.content || item.link || '';
          // Авто-переписывание через Groq/Gemini бесплатно если ключ есть
          try {
            if (process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY) {
              body = await this.ai.rewriteText(body);
            }
          } catch {}

          const row = await this.prisma.contentItem.create({
            data: {
              title: item.title,
              body,
              status: source.autoPublish && source.channelId ? 'APPROVED' : 'PENDING_REVIEW',
              watermarkText: process.env.DEFAULT_WATERMARK_TEXT || 'СВОЙ',
              channelId: source.channelId || undefined,
            },
          });
          created.push(row.id);

          // Если авто-публикация включена и канал указан - сразу публикуем (через очередь, но для MVP прямо)
          if (source.autoPublish && source.channelId) {
            // помечаем как SCHEDULED чтобы воркер подхватил
            await this.prisma.contentItem.update({ where: { id: row.id }, data: { status: 'SCHEDULED', scheduledFor: new Date() } }).catch(()=>{});
          }
        } catch {}
      }
      return { feedTitle: feed.title, createdIds: created };
    } catch (e: any) {
      this.logger.error(`fetchNow failed: ${e.message}`);
      throw new BadRequestException(`RSS ошибка: ${e.message}`);
    }
  }
}
