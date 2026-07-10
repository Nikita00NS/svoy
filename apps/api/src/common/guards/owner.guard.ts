import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.user) {
      throw new UnauthorizedException('Owner only');
    }
    const ownerId = process.env.OWNER_TELEGRAM_ID;
    const userTelegramId = req.user.telegramUserId?.toString?.() ?? String(req.user.telegramUserId);
    if (userTelegramId !== ownerId) {
      throw new UnauthorizedException('Owner only');
    }
    return true;
  }
}
