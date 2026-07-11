import { Module, forwardRef } from '@nestjs/common';
import { IntakesService } from './intakes.service';
import { IntakesController } from './intakes.controller';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [forwardRef(() => TelegramModule)],
  providers: [IntakesService],
  controllers: [IntakesController],
  exports: [IntakesService],
})
export class IntakesModule {}
