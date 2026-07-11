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
  // Fallback если база падает - чтобы не было 500
  private fallbackChannels: FallbackChannel[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async list() {
    try {
      const dbChannels = await this.prisma.channel.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      // Смешиваем DB + fallback (fallback сверху)
      return [...this.fallbackChannels, ...dbChannels];
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

    // Валидация BigInt, но не падаем
    let telegramIdBig: bigint | undefined;
    if (telegramIdStr) {
      try { telegramIdBig = BigInt(telegramIdStr); } catch { telegramIdBig = undefined; }
    }

    try {
      // Пытаемся найти существующий (включая удаленные) и восстановить
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
            return updated;
          }
        } catch (findErr: any) {
          this.logger.warn(`findFirst failed: ${findErr.message}, will create`);
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
      return created;
    } catch (e: any) {
      // Если БД вообще упала - создаем в памяти, чтобы не было 500
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
      // Удаляем дубликат по ID если был
      this.fallbackChannels = this.fallbackChannels.filter(c => c.telegramId !== telegramIdStr && c.handle !== handle);
      this.fallbackChannels.unshift(fallback);
      return fallback as any;
    }
  }
}
