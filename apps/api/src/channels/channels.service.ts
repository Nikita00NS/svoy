import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    try {
      return await this.prisma.channel.findMany({ orderBy: { createdAt: 'desc' } });
    } catch (e: any) {
      this.logger.error(`list failed: ${e.message}`);
      return [];
    }
  }

  async create(data: { title: string; handle?: string; telegramId?: string; postWatermark?: string; isActive?: boolean }) {
    if (!data.title || !data.title.trim()) {
      throw new BadRequestException('Название канала обязательно');
    }

    let handle: string | undefined = data.handle?.trim();
    if (handle) {
      handle = handle.replace(/^@/, '').trim();
      handle = handle.toLowerCase();
      if (!handle) handle = undefined;
    }

    let telegramId: bigint | undefined;
    if (data.telegramId) {
      const raw = String(data.telegramId).trim();
      if (raw) {
        try {
          // Telegram channel IDs типа -100... валидны для BigInt
          telegramId = BigInt(raw);
        } catch (e: any) {
          throw new BadRequestException(`Неверный Telegram ID: ${raw}. Должен быть числом, напр. -100123456789`);
        }
      }
    }

    try {
      return await this.prisma.channel.create({
        data: {
          title: data.title.trim(),
          handle: handle || undefined,
          telegramId,
          postWatermark: data.postWatermark?.trim() || 'СВОЙ',
          isActive: data.isActive ?? true,
        },
      });
    } catch (e: any) {
      this.logger.error(`create channel failed: ${e.message}`, e.stack);
      // Prisma unique constraint = P2002
      if (e.code === 'P2002') {
        const target = e.meta?.target?.join(', ') || 'поле';
        throw new BadRequestException(`Канал с таким ${target} уже существует`);
      }
      throw new BadRequestException(`Ошибка создания канала: ${e.message}`);
    }
  }
}
