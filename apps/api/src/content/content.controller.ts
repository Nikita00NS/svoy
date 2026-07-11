import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ContentStatus, ContentType } from '@prisma/client';
import { OwnerGuard } from '../common/guards/owner.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ContentService } from './content.service';
import { MediaService } from './media.service';

@Controller('content')
@UseGuards(OwnerGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService, private readonly mediaService: MediaService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.contentService.list(query);
  }

  @Post()
  create(@Body() body: { title?: string; body?: string; channelId?: string; mediaType?: ContentType; mediaFileId?: string; pollQuestion?: string; pollOptions?: string[]; watermarkText?: string }) {
    return this.contentService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { title?: string; body?: string; channelId?: string; watermarkText?: string; status?: ContentStatus; scheduledFor?: string; moderationComment?: string; pollQuestion?: string; pollOptions?: any }) {
    return this.contentService.update(id, body);
  }

  @Post(':id/rewrite')
  rewrite(@Param('id') id: string) {
    return this.contentService.rewrite(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.contentService.approve(id);
  }

  @Post(':id/schedule')
  schedule(@Param('id') id: string, @Body() body: { scheduledFor: string }) {
    return this.contentService.schedule(id, body.scheduledFor);
  }

  @Post(':id/publish-now')
  publishNow(@Param('id') id: string) {
    return this.contentService.publishNow(id);
  }

  @Post(':id/download-media')
  downloadMedia(@Param('id') id: string) {
    return this.mediaService.downloadTelegramMedia(id);
  }

  @Post(':id/process-watermark')
  processWatermark(@Param('id') id: string) {
    return this.contentService.processWatermark(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contentService.softDelete(id);
  }
}
