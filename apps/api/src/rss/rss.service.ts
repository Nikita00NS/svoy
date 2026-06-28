import { Injectable } from '@nestjs/common';
import Parser = require('rss-parser');
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RssService {
  private parser: Parser;
  constructor(private readonly prisma: PrismaService) {
    this.parser = new Parser();
  }

  list() {
    return this.prisma.rssSource.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: { title: string; url: string; isActive?: boolean }) {
    return this.prisma.rssSource.create({
      data: {
        title: data.title,
        url: data.url,
        isActive: data.isActive ?? true,
      },
    });
  }

  async fetchNow(id: string) {
    const source = await this.prisma.rssSource.findUnique({
      where: { id },
    });

    if (!source) return null;

    const feed = await this.parser.parseURL(source.url);
    const created: string[] = [];

    for (const item of feed.items.slice(0, 10)) {
      const row = await this.prisma.contentItem.create({
        data: {
          title: item.title,
          body: item.contentSnippet || item.content || item.link,
          status: 'PENDING_REVIEW',
          watermarkText: process.env.DEFAULT_WATERMARK_TEXT || 'СВОЙ',
        },
      });
      created.push(row.id);
    }

    return {
      feedTitle: feed.title,
      createdIds: created,
    };
  }
}
