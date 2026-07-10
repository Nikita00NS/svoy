import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OwnerGuard } from '../common/guards/owner.guard';
import { BotsService } from './bots.service';

@Controller('bots')
@UseGuards(OwnerGuard)
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Get()
  list() {
    return this.botsService.list();
  }

  @Post()
  create(@Body() body: { username: string; tokenRef: string; webhookPath: string; internalKey: string; isMaster?: boolean }) {
    return this.botsService.create(body);
  }

  @Post('setup-master-webhook')
  setupMasterWebhook() {
    return this.botsService.setupMasterWebhook();
  }
}
