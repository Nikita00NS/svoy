import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateTelegramLogin(query: any) {
    const { hash, ...data } = query;
    const secret = crypto.createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN || '').digest();

    const checkString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join('\n');

    const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex');

    if (hmac !== hash) throw new Error('Invalid Telegram hash');

    const authDate = parseInt(data.auth_date);
    if (Date.now() / 1000 - authDate > 86400) throw new Error('Auth date too old');

    const telegramUserId = BigInt(data.id);

    let user = await this.prisma.user.findUnique({ where: { telegramUserId } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          telegramUserId,
          username: data.username,
          firstName: data.first_name,
          lastName: data.last_name,
          photoUrl: data.photo_url,
          role: telegramUserId.toString() === process.env.SEED_OWNER_TG_ID ? 'OWNER' : 'USER',
        },
      });
    }

    return user;
  }

  async login(user: any) {
    const payload = { sub: user.id, telegramUserId: user.telegramUserId, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
}
