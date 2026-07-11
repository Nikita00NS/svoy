import { Body, Controller, Get, Post, Param, Patch, UseGuards } from '@nestjs/common';
import { OwnerGuard } from '../common/guards/owner.guard';
import { ChannelsService } from './channels.service';

@Controller('channels')
@UseGuards(OwnerGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  list() {
    return this.channelsService.list();
  }

  @Get(':id/stats')
  async stats(@Param('id') id: string) {
    return this.channelsService.getStats(id);
  }

  @Post()
  create(@Body() body: { title: string; handle?: string; telegramId?: string; postWatermark?: string; description?: string; autoModeration?: boolean; autoPublishRss?: boolean; isActive?: boolean }) {
    return this.channelsService.create(body as any);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { title?: string; handle?: string; telegramId?: string; postWatermark?: string; description?: string; autoModeration?: boolean; autoPublishRss?: boolean; settingsJson?: any }) {
    return this.channelsService.update(id, body as any);
  }
}
