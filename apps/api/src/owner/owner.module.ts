import { Module, forwardRef } from '@nestjs/common';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';
import { BotsModule } from '../bots/bots.module';

@Module({
  imports: [forwardRef(() => BotsModule)],
  controllers: [OwnerController],
  providers: [OwnerService],
})
export class OwnerModule {}
