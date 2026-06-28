import { Module } from '@nestjs/common';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({ imports: [TelegramModule], controllers: [BotsController], providers: [BotsService] })
export class BotsModule {}
