import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Parser = require('rss-parser');
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RssService {
  private readonly logger = new Logger(RssService.name);
  private parser: Parser;

  constructor(private readonly prisma: PrismaService) {
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

  async create(data: { title: string; url: string; isActive?: boolean }) {
    try {
      return await this.prisma.rssSource.create({ data: { title: data.title.trim(), url: data.url.trim(), isActive: data.isActive ?? true } });
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
          const row = await this.prisma.contentItem.create({
            data: {
              title: item.title,
              body: item.contentSnippet || item.content || item.link,
              status: 'PENDING_REVIEW',
              watermarkText: process.env.DEFAULT_WATERMARK_TEXT || 'СВОЙ',
            },
          });
          created.push(row.id);
        } catch {}
      }
      return { feedTitle: feed.title, createdIds: created };
    } catch (e: any) {
      this.logger.error(`fetchNow failed: ${e.message}`);
      throw new BadRequestException(`RSS ошибка: ${e.message}`);
    }
  }
}
