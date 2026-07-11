import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { OwnerGuard } from '../common/guards/owner.guard';
import { RssService } from './rss.service';

@Controller('rss')
@UseGuards(OwnerGuard)
export class RssController {
  constructor(private readonly rssService: RssService) {}

  @Get()
  list() {
    return this.rssService.list();
  }

  @Post()
  create(@Body() body: { title: string; url: string; isActive?: boolean }) {
    return this.rssService.create(body);
  }

  @Post(':id/fetch')
  fetchNow(@Param('id') id: string) {
    return this.rssService.fetchNow(id);
  }
}
