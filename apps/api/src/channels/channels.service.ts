import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type FallbackChannel = {
  id: string;
  title: string;
  handle?: string;
  telegramId?: string;
  postWatermark: string;
  isActive: boolean;
  createdAt: string;
};

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);
  private fallbackChannels: FallbackChannel[] = [];

  constructor(private readonly prisma: PrismaService) {}

  private serialize(channel: any) {
    return {
      ...channel,
      telegramId: channel.telegramId ? channel.telegramId.toString() : channel.telegramId,
    };
  }

  async list() {
    try {
      const dbChannels = await this.prisma.channel.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      const serialized = dbChannels.map(c => this.serialize(c));
      return [...this.fallbackChannels, ...serialized];
    } catch (e: any) {
      this.logger.warn(`DB list failed, using fallback: ${e.message}`);
      return this.fallbackChannels;
    }
  }

  async create(data: { title: string; handle?: string; telegramId?: string; postWatermark?: string; isActive?: boolean }) {
    const title = (data.title || '').trim() || 'СВОЙ Луганск';
    let handle = (data.handle || '').trim().replace(/^@/, '').toLowerCase() || undefined;
    let telegramIdStr = (data.telegramId || '').trim() || undefined;
    const watermark = (data.postWatermark || '').trim() || 'СВОЙ Луганск';

    let telegramIdBig: bigint | undefined;
    if (telegramIdStr) {
      try { telegramIdBig = BigInt(telegramIdStr); } catch { telegramIdBig = undefined; }
    }

    try {
      if (handle || telegramIdBig) {
        try {
          const existing = await this.prisma.channel.findFirst({
            where: {
              OR: [
                ...(handle ? [{ handle }] : []),
                ...(telegramIdBig ? [{ telegramId: telegramIdBig }] : []),
              ],
            },
          });
          if (existing) {
            const updated = await this.prisma.channel.update({
              where: { id: existing.id },
              data: {
                title,
                handle: handle ?? existing.handle,
                telegramId: telegramIdBig ?? existing.telegramId,
                postWatermark: watermark,
                isActive: true,
                deletedAt: null,
              },
            });
            return this.serialize(updated);
          }
        } catch (findErr: any) {
          this.logger.warn(`findFirst failed: ${findErr.message}`);
        }
      }

      const created = await this.prisma.channel.create({
        data: {
          title,
          handle,
          telegramId: telegramIdBig,
          postWatermark: watermark,
          isActive: true,
        },
      });
      return this.serialize(created);
    } catch (e: any) {
      this.logger.error(`DB create failed, using fallback: ${e.message}`, e.stack);
      const fallback: FallbackChannel = {
        id: `fallback_${Date.now()}`,
        title,
        handle,
        telegramId: telegramIdStr,
        postWatermark: watermark,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      this.fallbackChannels = this.fallbackChannels.filter(c => c.telegramId !== telegramIdStr && c.handle !== handle);
      this.fallbackChannels.unshift(fallback);
      return fallback as any;
    }
  }
}
