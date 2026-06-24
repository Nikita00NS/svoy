import { Module } from '@nestjs/common';
import { BotsService } from './bots.service';
import { TelegramBotFactory } from './telegram-bot.factory';
import { MasterBot } from './master-bot';

@Module({
  providers: [BotsService, TelegramBotFactory, MasterBot],
  exports: [BotsService, TelegramBotFactory],
})
export class BotsModule {}