import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.user || req.user.telegramUserId?.toString() !== process.env.OWNER_TELEGRAM_ID) {
      throw new UnauthorizedException('Owner only');
    }
    return true;
  }
}
