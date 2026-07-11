import { Module, forwardRef } from '@nestjs/common';
import { OwnerController } from './owner.controller';
import { BotsModule } from '../bots/bots.module';

@Module({
  imports: [forwardRef(() => BotsModule)],
  controllers: [OwnerController],
})
export class OwnerModule {}
