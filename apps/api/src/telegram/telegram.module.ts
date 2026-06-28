import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramApiService } from './telegram-api.service';
import { IntakesModule } from '../intakes/intakes.module';
import { ModerationModule } from '../moderation/moderation.module';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [IntakesModule, ModerationModule, ContentModule],
  controllers: [TelegramController],
  providers: [TelegramService, TelegramApiService],
  exports: [TelegramApiService],
})
export class TelegramModule {}
