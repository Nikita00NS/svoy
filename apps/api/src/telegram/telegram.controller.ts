import { Body, Controller, Headers, Param, Post, UnauthorizedException } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook/:botKey')
  async webhook(@Param('botKey') botKey: string, @Headers('x-telegram-bot-api-secret-token') secret: string, @Body() body: any) {
    if (botKey !== process.env.MASTER_BOT_KEY) throw new UnauthorizedException('Unknown bot key');
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) throw new UnauthorizedException('Invalid secret');
    return this.telegramService.handleUpdate(body);
  }
}
