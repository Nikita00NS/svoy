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
  list() {
    return this.intakesService.listAll();
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: IntakeStatus }) {
    return this.intakesService.updateStatus(id, body.status);
  }
}
