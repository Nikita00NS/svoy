import { Controller, Get, Post, UseGuards, Logger } from '@nestjs/common';
import { OwnerGuard } from '../common/guards/owner.guard';
import { PrismaService } from '../prisma/prisma.service';
import { BotsService } from '../bots/bots.service';

@Controller('admin')
@UseGuards(OwnerGuard)
export class OwnerController {
  private readonly logger = new Logger(OwnerController.name);
  constructor(private readonly prisma: PrismaService, private readonly botsService: BotsService) {}

  @Get('dashboard')
  async dashboard() {
    const safeCount = async (fn: () => Promise<number>) => {
      try { return await fn(); } catch (e: any) { this.logger.warn(`dashboard count failed: ${e.message}`); return 0; }
    };

    const [users, channels, bots, requests, content, moderation, rss] = await Promise.all([
      safeCount(() => this.prisma.user.count()),
      safeCount(() => this.prisma.channel.count()),
      safeCount(() => this.prisma.bot.count()),
      safeCount(() => this.prisma.intakeRequest.count()),
      safeCount(() => this.prisma.contentItem.count()),
      safeCount(() => this.prisma.moderationEvent.count()),
      safeCount(() => this.prisma.rssSource.count()),
    ]);
    return { users, channels, bots, requests, content, moderation, rss };
  }

  @Post('setup/master-bot')
  async setupMasterBot() {
    try {
      return await this.botsService.setupMasterWebhook();
    } catch (e: any) {
      this.logger.error(`setupMasterWebhook failed: ${e.message}`, e.stack);
      return { ok: false, error: e.message };
    }
  }
}
