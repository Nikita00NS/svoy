import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { AiModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';
import { WatermarkService } from './watermark.service';
import { MediaService } from './media.service';
import { TelegramModule } from '../telegram/telegram.module';
import { AuditModule } from '../audit/audit.module';
import { QueuesModule } from '../queues/queues.module';

@Module({ imports: [AiModule, StorageModule, TelegramModule, AuditModule, QueuesModule], controllers: [ContentController], providers: [ContentService, WatermarkService, MediaService], exports: [ContentService, MediaService] })
export class ContentModule {}
