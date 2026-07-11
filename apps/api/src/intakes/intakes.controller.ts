import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { IntakeStatus } from '@prisma/client';
import { OwnerGuard } from '../common/guards/owner.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { IntakesService } from './intakes.service';

@Controller('admin/intakes')
@UseGuards(OwnerGuard)
export class IntakesController {
  constructor(private readonly intakesService: IntakesService) {}

  @Get()
  async list(@Query() query: PaginationDto) {
    return this.intakesService.listPaginated(query);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: IntakeStatus; moderatorComment?: string; contentItemId?: string }) {
    return this.intakesService.updateStatusFull(id, body.status, body.moderatorComment, body.contentItemId);
  }

  @Patch(':id/comment')
  async updateComment(@Param('id') id: string, @Body() body: { moderatorComment: string }) {
    return this.intakesService.updateComment(id, body.moderatorComment);
  }
}
