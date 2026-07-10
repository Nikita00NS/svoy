import { MiddlewareConsumer, Module, NestModule, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionAuthMiddleware } from './session-auth.middleware';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [forwardRef(() => TelegramModule)],
  controllers: [AuthController],
  providers: [AuthService, SessionAuthMiddleware],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SessionAuthMiddleware)
      .forRoutes('auth/me', 'admin', 'channels', 'bots', 'moderation', 'content', 'rss', 'users', 'intakes', 'audit');
  }
}
