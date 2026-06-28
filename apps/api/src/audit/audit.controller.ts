import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OwnerGuard } from '../common/guards/owner.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(OwnerGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.auditService.list(query.page, query.limit);
  }
}
