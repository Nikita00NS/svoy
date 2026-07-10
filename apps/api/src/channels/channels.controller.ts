import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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

  @Post()
  create(@Body() body: { title: string; handle?: string; telegramId?: string; postWatermark?: string; isActive?: boolean }) {
    return this.channelsService.create(body);
  }
}
