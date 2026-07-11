import { Module } from '@nestjs/common';
import { RssController } from './rss.controller';
import { RssService } from './rss.service';
import { AiModule } from '../ai/ai.module';

@Module({ imports: [AiModule], controllers: [RssController], providers: [RssService], exports: [RssService] })
export class RssModule {}
