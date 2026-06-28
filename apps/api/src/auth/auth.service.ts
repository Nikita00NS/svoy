import { createHash, createHmac, randomBytes } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  verifyTelegramLogin(payload: Record<string, string>) {
    const botToken = process.env.TELEGRAM_LOGIN_BOT_TOKEN;
    if (!botToken) throw new UnauthorizedException('Telegram login disabled');
    const { hash, ...rest } = payload;
    if (!hash) throw new UnauthorizedException('Missing hash');
    const dataCheckString = Object.keys(rest).sort().map((key) => `${key}=${rest[key]}`).join('\n');
    const secretKey = createHash('sha256').update(botToken).digest();
    const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    return computed === hash;
  }

  async loginTelegram(payload: Record<string, string>) {
    const telegramId = payload.id;
    if (!telegramId || telegramId !== process.env.OWNER_TELEGRAM_ID) throw new UnauthorizedException('Owner only');
    const user = await this.prisma.user.upsert({
      where: { telegramUserId: BigInt(telegramId) },
      update: {
        username: payload.username,
        firstName: payload.first_name,
        lastName: payload.last_name,
        role: 'OWNER',
      },
      create: {
        telegramUserId: BigInt(telegramId),
        username: payload.username,
        firstName: payload.first_name,
        lastName: payload.last_name,
        role: 'OWNER',
      },
    });
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hash(rawToken);
    await this.prisma.session.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    return { rawToken, user };
  }

  async logout(rawToken?: string) {
    if (!rawToken) return;
    await this.prisma.session.deleteMany({ where: { tokenHash: this.hash(rawToken) } });
  }

  async resolveSession(rawToken?: string) {
    if (!rawToken) return null;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.hash(rawToken) },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) return null;
    return session.user;
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
