import { Injectable } from '@nestjs/common';
import { basename, extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { TelegramApiService } from '../telegram/telegram-api.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly telegramApi: TelegramApiService,
  ) {}

  async downloadTelegramMedia(contentItemId: string) {
    const item = await this.prisma.contentItem.findUnique({ where: { id: contentItemId } });
    if (!item?.mediaFileId) return null;

    const file = await this.telegramApi.getFile(item.mediaFileId);
    if (!file?.file_path) return null;
    const response = await this.telegramApi.downloadFile(file.file_path, 'arraybuffer');
    const originalName = basename(file.file_path);
    const ext = extname(originalName) || inferExt(item.mediaType || undefined);
    const filename = `${contentItemId}${ext}`;
    const localMediaPath = await this.storage.saveBinaryFile('downloads', filename, Buffer.from(response.data));

    return this.prisma.contentItem.update({
      where: { id: contentItemId },
      data: { localMediaPath },
    });
  }
}

function inferExt(mediaType?: string) {
  if (mediaType === 'PHOTO') return '.jpg';
  if (mediaType === 'VIDEO') return '.mp4';
  return '.bin';
}
