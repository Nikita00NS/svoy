import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  async telegramLogin(@Body() body: Record<string, string>, @Res({ passthrough: true }) res: Response) {
    if (!this.authService.verifyTelegramLogin(body)) throw new UnauthorizedException('Invalid Telegram login');
    const { rawToken, user } = await this.authService.loginTelegram(body);
    res.cookie(process.env.COOKIE_NAME || 'svoy_admin_session', rawToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
    return { ok: true, user: { telegramUserId: user.telegramUserId.toString(), username: user.username, role: user.role } };
  }

  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const cookieName = process.env.COOKIE_NAME || 'svoy_admin_session';
    await this.authService.logout(req.cookies?.[cookieName]);
    res.clearCookie(cookieName);
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: any) {
    if (!req.user) throw new UnauthorizedException();
    return {
      authenticated: true,
      telegramUserId: req.user.telegramUserId.toString(),
      username: req.user.username,
      role: req.user.role,
    };
  }
}
