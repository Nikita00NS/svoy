import { Module } from '@nestjs/common';
import { IntakesService } from './intakes.service';
import { IntakesController } from './intakes.controller';

@Module({ providers: [IntakesService], controllers: [IntakesController], exports: [IntakesService] })
export class IntakesModule {}
