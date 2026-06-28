import { Module } from '@nestjs/common';
import { OwnerController } from './owner.controller';
import { BotsModule } from '../bots/bots.module';

@Module({ imports: [BotsModule], controllers: [OwnerController] })
export class OwnerModule {}
