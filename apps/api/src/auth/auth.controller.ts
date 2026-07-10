import { Body, Controller, Get, Param, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // === 1. ЛОГИН ПО ПАРОЛЮ (главный, чтобы сразу работать) ===
  @Post('login')
  async loginPassword(
    @Body() body: { login: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { login, password } = body || ({} as any);
    const { rawToken, user } = await this.authService.loginPassword(login, password);

    res.cookie(process.env.COOKIE_NAME || 'svoy_admin_session', rawToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { ok: true, user };
  }

  // === 2. СТАРЫЙ WIDGET (оставляем, не мешает) ===
  @Post('telegram')
  async telegramLogin(@Body() body: Record<string, string>, @Res({ passthrough: true }) res: Response) {
    if (!this.authService.verifyTelegramLogin(body)) {
      throw new UnauthorizedException('Invalid Telegram login');
    }
    const { rawToken, user } = await this.authService.loginTelegram(body);
    res.cookie(process.env.COOKIE_NAME || 'svoy_admin_session', rawToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { ok: true, user };
  }

  // === 3. ВХОД ЧЕРЕЗ ТГ-БОТА (основной, который ты просишь оставить) ===
  @Post('bot/request')
  async requestBotLogin() {
    return this.authService.createBotLoginRequest();
  }

  @Get('bot/status/:token')
  async botLoginStatus(@Param('token') token: string) {
    return this.authService.getBotLoginStatus(token);
  }

  @Post('bot/consume/:token')
  async consumeBotLogin(@Param('token') token: string, @Res({ passthrough: true }) res: Response) {
    const result = this.authService.consumeBotLogin(token);
    if (!result) {
      throw new UnauthorizedException('Login is not approved');
    }

    res.cookie(process.env.COOKIE_NAME || 'svoy_admin_session', result.rawToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { ok: true, user: result.user };
  }

  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const cookieName = process.env.COOKIE_NAME || 'svoy_admin_session';
    await this.authService.logout(req.cookies?.[cookieName]);
    res.clearCookie(cookieName, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
    });
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: any) {
    if (!req.user) {
      return { authenticated: false };
    }
    return {
      authenticated: true,
      telegramUserId: req.user.telegramUserId.toString(),
      username: req.user.username,
      role: req.user.role,
    };
  }
}
