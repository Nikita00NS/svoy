import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TelegramModule } from './telegram/telegram.module';
import { IntakesModule } from './intakes/intakes.module';
import { OwnerModule } from './owner/owner.module';
import { ChannelsModule } from './channels/channels.module';
import { BotsModule } from './bots/bots.module';
import { ModerationModule } from './moderation/moderation.module';
import { ContentModule } from './content/content.module';
import { RssModule } from './rss/rss.module';
import { QueuesModule } from './queues/queues.module';
import { AiModule } from './ai/ai.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';
import { AdminUiModule } from './admin-ui/admin-ui.module';
import { validateEnv } from './config/env.schema';
import { RateLimitMiddleware } from './common/rate-limit.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    AuthModule,
    TelegramModule,
    IntakesModule,
    OwnerModule,
    ChannelsModule,
    BotsModule,
    ModerationModule,
    ContentModule,
    RssModule,
    QueuesModule,
    AiModule,
    UsersModule,
    HealthModule,
    AuditModule,
    AdminUiModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
