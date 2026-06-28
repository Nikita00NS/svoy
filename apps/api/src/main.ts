\import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OwnerGuard } from '../common/guards/owner.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(OwnerGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.usersService.list(query.page, query.limit, query.q);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { role?: UserRole; isActive?: boolean },
  ) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }
}
