import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    try {
      return await this.prisma.channel.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
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
      handle = handle.replace(/^@/, '').trim().toLowerCase();
      if (!handle) handle = undefined;
    }

    let telegramId: bigint | undefined;
    if (data.telegramId) {
      const raw = String(data.telegramId).trim();
      if (raw) {
        try {
          telegramId = BigInt(raw);
        } catch {
          throw new BadRequestException(`Неверный Telegram ID: ${raw}. Пример: -1003991505640`);
        }
      }
    }

    const watermark = data.postWatermark?.trim() || 'СВОЙ';

    try {
      // Ищем даже удаленные (deletedAt) - если есть, восстанавливаем
      if (handle || telegramId) {
        const existing = await this.prisma.channel.findFirst({
          where: {
            OR: [
              ...(handle ? [{ handle }] : []),
              ...(telegramId ? [{ telegramId }] : []),
            ],
          },
        });
        if (existing) {
          return await this.prisma.channel.update({
            where: { id: existing.id },
            data: {
              title: data.title.trim(),
              handle: handle ?? existing.handle,
              telegramId: telegramId ?? existing.telegramId,
              postWatermark: watermark,
              isActive: true,
              deletedAt: null, // восстанавливаем если был удален
            },
          });
        }
      }

      return await this.prisma.channel.create({
        data: {
          title: data.title.trim(),
          handle,
          telegramId,
          postWatermark: watermark,
          isActive: true,
        },
      });
    } catch (e: any) {
      this.logger.error(`create channel failed: ${e.message}`, e.stack);
      if (e instanceof BadRequestException) throw e;
      if (e.code === 'P2002') {
        throw new BadRequestException('Канал с таким Handle или Telegram ID уже есть в базе (даже удаленный). Поменяй Handle на другой, напр. LNRSVOY2, или очисти базу.');
      }
      throw new BadRequestException(`Ошибка: ${e.message}`);
    }
  }

  async deleteAllForFix() {
    // Вспомогательный метод для очистки если нужно - не используется в API, но можно вызвать
    return this.prisma.channel.deleteMany({});
  }
}
