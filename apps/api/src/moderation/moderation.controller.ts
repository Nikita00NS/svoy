import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ModerationAction } from '@prisma/client';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ModerationService } from './moderation.service';

@Controller('moderation')
@UseGuards(OwnerGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get()
  list() {
    return this.moderationService.list();
  }

  @Post('apply')
  apply(@CurrentUser() user: any, @Body() body: { channelId?: string; chatId: string; targetTelegramId: string; messageId?: number; action: ModerationAction; reason?: string }) {
    return this.moderationService.apply({ ...body, actorUserId: user.id });
  }

  @Post('escalate')
  escalate(@CurrentUser() user: any, @Body() body: { channelId?: string; chatId: string; targetTelegramId: string; reason?: string }) {
    return this.moderationService.applyEscalation({ ...body, actorUserId: user.id });
  }
}
