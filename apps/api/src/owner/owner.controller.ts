import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OwnerGuard } from '../common/guards/owner.guard';
import { PrismaService } from '../prisma/prisma.service';
import { BotsService } from '../bots/bots.service';

@Controller('admin')
@UseGuards(OwnerGuard)
export class OwnerController {
  constructor(private readonly prisma: PrismaService, private readonly botsService: BotsService) {}

  @Get('dashboard')
  async dashboard() {
    const [users, channels, bots, requests, content, moderation, rss] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.channel.count(),
      this.prisma.bot.count(),
      this.prisma.intakeRequest.count(),
      this.prisma.contentItem.count(),
      this.prisma.moderationEvent.count(),
      this.prisma.rssSource.count(),
    ]);
    return { users, channels, bots, requests, content, moderation, rss };
  }

  @Post('setup/master-bot')
  setupMasterBot() {
    return this.botsService.setupMasterWebhook();
  }
}
