import { Controller, Get, Post, Req, Res, UseGuards, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('telegram/login')
  async telegramLogin(@Query() query: any, @Res() res: any) {
    const user = await this.authService.validateTelegramLogin(query);
    const { accessToken } = await this.authService.login(user);
    
    // Set httpOnly cookie
    res.cookie('session', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    return res.redirect(`${process.env.APP_URL}/auth/success`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: any) {
    return user;
  }

  @Post('logout')
  async logout(@Res() res: any) {
    res.clearCookie('session');
    return res.json({ success: true });
  }

  @Get('telegram/oidc-start')
  async oidcStart(@Res() res: any) {
    const url = await this.authService.startOidcFlow();
    return res.redirect(url);
  }

  @Get('telegram/callback')
  async oidcCallback(@Query() query: any, @Res() res: any) {
    // For now return 501 as per spec (use Login Widget in prod)
    return res.status(501).json({ message: 'OIDC not fully implemented, use Telegram Login Widget' });
  }
}
