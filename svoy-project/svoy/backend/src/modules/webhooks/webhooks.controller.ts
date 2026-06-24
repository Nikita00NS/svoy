import { Controller, Post, Param, Body, Headers, HttpCode } from '@nestjs/common';
import { TelegramBotFactory } from '../bots/telegram-bot.factory';
import { PrismaService } from '../../common/prisma/prisma.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private botFactory: TelegramBotFactory,
    private prisma: PrismaService,
  ) {}

  @Post('telegram/:botSlug')
  @HttpCode(200)
  async telegramWebhook(
    @Param('botSlug') botSlug: string,
    @Headers('x-telegram-bot-api-secret-token') secretToken: string,
    @Body() update: any,
  ) {
    if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return { error: 'Invalid secret token' };
    }

    const bot = await this.botFactory.getBot(botSlug);
    if (!bot) return { error: 'Bot not found' };

    await bot.handleUpdate(update);
    return { ok: true };
  }

  @Post('yookassa')
  async yookassaWebhook(@Body() event: any) {
    // TODO: verify signature
    console.log('YooKassa webhook received:', event);
    return { ok: true };
  }
}
