import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { BotsModule } from './modules/bots/bots.module';
import { SourcesModule } from './modules/sources/sources.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { ContentModule } from './modules/content/content.module';
import { MediaModule } from './modules/media/media.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { AdsModule } from './modules/ads/ads.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AppealsModule } from './modules/appeals/appeals.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { SupportModule } from './modules/support/support.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { SettingsModule } from './modules/settings/settings.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60'),
      limit: parseInt(process.env.RATE_LIMIT_MAX || '120'),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ChannelsModule,
    BotsModule,
    SourcesModule,
    IngestionModule,
    ContentModule,
    MediaModule,
    ModerationModule,
    AdsModule,
    PaymentsModule,
    AppealsModule,
    JobsModule,
    SupportModule,
    NotificationsModule,
    AuditModule,
    SettingsModule,
    WebhooksModule,
    HealthModule,
  ],
})
export class AppModule {}