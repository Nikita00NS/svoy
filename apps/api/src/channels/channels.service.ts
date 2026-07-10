import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.channel.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: { title: string; handle?: string; telegramId?: string; postWatermark?: string; isActive?: boolean }) {
    return this.prisma.channel.create({
      data: {
        title: data.title,
        handle: data.handle,
        telegramId: data.telegramId ? BigInt(data.telegramId) : undefined,
        postWatermark: data.postWatermark,
        isActive: data.isActive ?? true,
      },
    });
  }
}
