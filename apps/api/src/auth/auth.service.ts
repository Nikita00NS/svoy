import { createHash, createHmac, randomBytes } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramApiService } from '../telegram/telegram-api.service';

type PendingBotLogin = {
  token: string;
  approved: boolean;
  createdAt: number;
  rawToken?: string;
  user?: {
    telegramUserId: string;
    username?: string | null;
    role: string;
  };
};

@Injectable()
export class AuthService {
  private readonly pendingBotLogins = new Map<string, PendingBotLogin>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramApi: TelegramApiService,
  ) {}

  // ========== TELEGRAM WIDGET LOGIN (оставляем, может пригодится) ==========
  verifyTelegramLogin(payload: Record<string, string>) {
    const botToken = process.env.TELEGRAM_LOGIN_BOT_TOKEN;
    if (!botToken) throw new UnauthorizedException('Telegram login disabled');
    const { hash, ...rest } = payload;
    if (!hash) throw new UnauthorizedException('Missing hash');
    const dataCheckString = Object.keys(rest)
      .sort()
      .map((key) => `${key}=${rest[key]}`)
      .join('\n');
    const secretKey = createHash('sha256').update(botToken).digest();
    const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    return computed === hash;
  }

  async loginTelegram(payload: Record<string, string>) {
    const telegramId = payload.id;
    if (!telegramId || telegramId !== process.env.OWNER_TELEGRAM_ID) {
      throw new UnauthorizedException('Owner only');
    }

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
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      rawToken,
      user: {
        telegramUserId: user.telegramUserId.toString(),
        username: user.username,
        role: user.role,
      },
    };
  }

  // ========== НОВОЕ: ЛОГИН/ПАРОЛЬ (главный вход) ==========
  async loginPassword(login: string, password: string) {
    const expectedLogin = process.env.ADMIN_LOGIN || 'admin';
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword) {
      throw new UnauthorizedException('ADMIN_PASSWORD не задан на сервере');
    }

    if (!login || !password) {
      throw new UnauthorizedException('Login и password обязательны');
    }

    // Простое сравнение (достаточно для MVP). Хочешь — потом заменим на bcrypt
    if (login !== expectedLogin || password !== expectedPassword) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const ownerTelegramId = process.env.OWNER_TELEGRAM_ID || '7320418026';

    // Создаем/обновляем OWNER пользователя в БД под тем же telegramId, чтобы OwnerGuard пропустил
    const user = await this.prisma.user.upsert({
      where: { telegramUserId: BigInt(ownerTelegramId) },
      update: {
        role: 'OWNER',
        username: login,
      },
      create: {
        telegramUserId: BigInt(ownerTelegramId),
        role: 'OWNER',
        username: login,
      },
    });

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hash(rawToken);
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      rawToken,
      user: {
        telegramUserId: user.telegramUserId.toString(),
        username: user.username,
        role: user.role,
      },
    };
  }

  // ========== ПОДТВЕРЖДЕНИЕ ЧЕРЕЗ БОТА (второй способ, оставляем) ==========
  async createBotLoginRequest() {
    const ownerTelegramId = process.env.OWNER_TELEGRAM_ID;
    if (!ownerTelegramId) {
      throw new UnauthorizedException('OWNER_TELEGRAM_ID missing');
    }

    const token = randomBytes(24).toString('hex');
    this.pendingBotLogins.set(token, {
      token,
      approved: false,
      createdAt: Date.now(),
    });

    const approveText = `approve_login:${token}`;
    const denyText = `deny_login:${token}`;

    await this.telegramApi.sendMessage(ownerTelegramId, 'Подтвердить вход в админ-панель СВОЙ?', {
      inline_keyboard: [
        [
          { text: '✅ Да, это я', callback_data: approveText },
          { text: '❌ Нет', callback_data: denyText },
        ],
      ],
    });

    return { token };
  }

  async approveBotLogin(token: string) {
    const pending = this.pendingBotLogins.get(token);
    if (!pending) return false;
    if (Date.now() - pending.createdAt > 10 * 60 * 1000) {
      this.pendingBotLogins.delete(token);
      return false;
    }

    const ownerTelegramId = process.env.OWNER_TELEGRAM_ID;
    if (!ownerTelegramId) return false;

    const user = await this.prisma.user.upsert({
      where: { telegramUserId: BigInt(ownerTelegramId) },
      update: { role: 'OWNER' },
      create: {
        telegramUserId: BigInt(ownerTelegramId),
        role: 'OWNER',
      },
    });

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hash(rawToken);
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    pending.approved = true;
    pending.rawToken = rawToken;
    pending.user = {
      telegramUserId: user.telegramUserId.toString(),
      username: user.username,
      role: user.role,
    };
    this.pendingBotLogins.set(token, pending);
    return true;
  }

  denyBotLogin(token: string) {
    const pending = this.pendingBotLogins.get(token);
    if (!pending) return false;
    this.pendingBotLogins.delete(token);
    return true;
  }

  getBotLoginStatus(token: string) {
    const pending = this.pendingBotLogins.get(token);
    if (!pending) return { found: false, approved: false };

    if (Date.now() - pending.createdAt > 10 * 60 * 1000) {
      this.pendingBotLogins.delete(token);
      return { found: false, approved: false };
    }

    return {
      found: true,
      approved: pending.approved,
      rawToken: pending.rawToken,
      user: pending.user,
    };
  }

  consumeBotLogin(token: string) {
    const pending = this.pendingBotLogins.get(token);
    if (!pending?.approved || !pending.rawToken || !pending.user) {
      return null;
    }

    this.pendingBotLogins.delete(token);
    return {
      rawToken: pending.rawToken,
      user: pending.user,
    };
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
