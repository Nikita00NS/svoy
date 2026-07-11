import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramApiService } from '../telegram/telegram-api.service';

type FallbackChannel = {
  id: string;
  title: string;
  handle?: string;
  telegramId?: string;
  postWatermark: string;
  description?: string;
  autoModeration?: boolean;
  autoPublishRss?: boolean;
  isActive: boolean;
  createdAt: string;
  statsJson?: any;
};

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);
  private fallbackChannels: FallbackChannel[] = [];

  constructor(private readonly prisma: PrismaService, private readonly telegramApi: TelegramApiService) {}

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

  async getStats(id: string) {
    try {
      const channel = await this.prisma.channel.findUnique({ where: { id } });
      if (!channel) throw new BadRequestException('Канал не найден');
      if (!channel.telegramId) return { channel: this.serialize(channel), subscribers: null, chat: null, message: 'Укажи Telegram ID для статистики' };

      const chat = await this.telegramApi.getChat(channel.telegramId.toString());
      const count = await this.telegramApi.getChatMembersCount(channel.telegramId.toString());
      const stats = { subscribers: count, chat, contentCount: await this.prisma.contentItem.count({ where: { channelId: id, deletedAt: null } }).catch(()=>0) };

      // Сохраняем статистику в БД
      try {
        await this.prisma.channel.update({ where: { id }, data: { statsJson: stats as any } });
      } catch {}

      return { channel: this.serialize(channel), ...stats };
    } catch (e: any) {
      throw new BadRequestException(`Статистика ошибка: ${e.message}`);
    }
  }

  async update(id: string, data: { title?: string; handle?: string; telegramId?: string; postWatermark?: string; description?: string; autoModeration?: boolean; autoPublishRss?: boolean; settingsJson?: any; isActive?: boolean }) {
    try {
      let handle = data.handle?.trim().replace(/^@/, '').toLowerCase() || undefined;
      let telegramId: bigint | undefined;
      if (data.telegramId) {
        try { telegramId = BigInt(String(data.telegramId).trim()); } catch { throw new BadRequestException('Неверный Telegram ID'); }
      }
      const updated = await this.prisma.channel.update({
        where: { id },
        data: {
          title: data.title?.trim(),
          handle,
          telegramId,
          postWatermark: data.postWatermark?.trim(),
          description: data.description?.trim(),
          autoModeration: data.autoModeration,
          autoPublishRss: data.autoPublishRss,
          settingsJson: data.settingsJson,
          isActive: data.isActive,
        },
      });
      return this.serialize(updated);
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException(`Ошибка обновления канала: ${e.message}`);
    }
  }

  async create(data: { title: string; handle?: string; telegramId?: string; postWatermark?: string; description?: string; autoModeration?: boolean; autoPublishRss?: boolean; isActive?: boolean }) {
    const title = (data.title || '').trim() || 'СВОЙ';
    let handle = (data.handle || '').trim().replace(/^@/, '').toLowerCase() || undefined;
    let telegramIdStr = (data.telegramId || '').trim() || undefined;
    const watermark = (data.postWatermark || '').trim() || 'СВОЙ';

    let telegramIdBig: bigint | undefined;
    if (telegramIdStr) {
      try { telegramIdBig = BigInt(telegramIdStr); } catch { telegramIdBig = undefined; }
    }

    try {
      if (handle || telegramIdBig) {
        try {
          const existing = await this.prisma.channel.findFirst({
            where: { OR: [...(handle ? [{ handle }] : []), ...(telegramIdBig ? [{ telegramId: telegramIdBig }] : [])] },
          });
          if (existing) {
            const updated = await this.prisma.channel.update({
              where: { id: existing.id },
              data: { title, handle: handle ?? existing.handle, telegramId: telegramIdBig ?? existing.telegramId, postWatermark: watermark, isActive: true, deletedAt: null, description: data.description },
            });
            return this.serialize(updated);
          }
        } catch {}
      }
      const created = await this.prisma.channel.create({
        data: {
          title,
          handle,
          telegramId: telegramIdBig,
          postWatermark: watermark,
          description: data.description,
          autoModeration: data.autoModeration ?? true,
          autoPublishRss: data.autoPublishRss ?? false,
          isActive: true,
        },
      });
      return this.serialize(created);
    } catch (e: any) {
      this.logger.error(`DB create failed, fallback: ${e.message}`);
      const fallback: FallbackChannel = { id: `fallback_${Date.now()}`, title, handle, telegramId: telegramIdStr, postWatermark: watermark, isActive: true, createdAt: new Date().toISOString() };
      this.fallbackChannels = this.fallbackChannels.filter(c => c.telegramId !== telegramIdStr && c.handle !== handle);
      this.fallbackChannels.unshift(fallback);
      return fallback as any;
    }
  }
}
