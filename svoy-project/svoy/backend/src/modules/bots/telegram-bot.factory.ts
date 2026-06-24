import { Injectable } from '@nestjs/common';
import { Bot } from 'grammy';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TelegramBotFactory {
  private bots: Map<string, Bot> = new Map();

  constructor(private prisma: PrismaService) {}

  async getBot(slug: string): Promise<Bot | null> {
    if (this.bots.has(slug)) return this.bots.get(slug)!;

    const botRecord = await this.prisma.bot.findUnique({
      where: { webhookPath: slug },
    });

    if (!botRecord) return null;

    const token = process.env[botRecord.tokenRef];
    if (!token) {
      console.error(`Bot token not found in env: ${botRecord.tokenRef}`);
      return null;
    }

    const bot = new Bot(token);
    this.bots.set(slug, bot);
    return bot;
  }
}
