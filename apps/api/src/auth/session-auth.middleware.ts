import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class SessionAuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request & { user?: unknown }, _res: Response, next: NextFunction) {
    const cookieName = process.env.COOKIE_NAME || 'svoy_admin_session';
    const user = await this.authService.resolveSession(req.cookies?.[cookieName]);
    if (user) req.user = user;
    next();
  }
}
