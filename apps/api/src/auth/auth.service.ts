import { createHash, createHmac, randomBytes } from 'crypto';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramApiService } from '../telegram/telegram-api.service';
import Redis from 'ioredis';

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

type FallbackSessionUser = {
  id: string;
  telegramUserId: string;
  username: string | null;
  role: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly pendingBotLogins = new Map<string, PendingBotLogin>();
  private readonly fallbackSessions = new Map<string, FallbackSessionUser>();
  private redis?: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramApi: TelegramApiService,
  ) {
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 2,
          enableReadyCheck: false,
          lazyConnect: true,
        });
        this.redis.connect().catch((e) => {
          this.logger.warn(`Redis connect failed: ${e.message}`);
          this.redis = undefined;
        });
      } catch (e: any) {
        this.logger.warn(`Redis init failed: ${e.message}`);
      }
    }
  }

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
    if (!telegramId || telegramId !== process.env.OWNER_TELEGRAM_ID) {
      throw new UnauthorizedException('Owner only');
    }
    const user = await this.prisma.user.upsert({
      where: { telegramUserId: BigInt(telegramId) },
      update: { username: payload.username, firstName: payload.first_name, lastName: payload.last_name, role: 'OWNER' },
      create: { telegramUserId: BigInt(telegramId), username: payload.username, firstName: payload.first_name, lastName: payload.last_name, role: 'OWNER' },
    });
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hash(rawToken);
    await this.prisma.session.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 7*24*60*60*1000) } });
    return { rawToken, user: { telegramUserId: user.telegramUserId.toString(), username: user.username, role: user.role } };
  }

  async loginPassword(login: string, password: string) {
    const expectedLogin = (process.env.ADMIN_LOGIN || 'admin').trim();
    const expectedPassword = (process.env.ADMIN_PASSWORD || 'СВОЙ2026!').trim();

    if (!login || !password) throw new UnauthorizedException('Login и password обязательны');
    if (login !== expectedLogin || password !== expectedPassword) throw new UnauthorizedException('Неверный логин или пароль');

    const ownerIdRaw = (process.env.OWNER_TELEGRAM_ID || '7320418026').trim();
    let ownerBigInt: bigint;
    try { ownerBigInt = BigInt(ownerIdRaw); } catch { ownerBigInt = BigInt(7320418026); }

    // Пытаемся через Prisma, если падает - fallback в память/Redis чтобы не давать 500
    try {
      const user = await this.prisma.user.upsert({
        where: { telegramUserId: ownerBigInt },
        update: { role: 'OWNER', username: login },
        create: { telegramUserId: ownerBigInt, role: 'OWNER', username: login },
      });
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = this.hash(rawToken);
      await this.prisma.session.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now()+7*24*60*60*1000) } });
      return { rawToken, user: { telegramUserId: user.telegramUserId.toString(), username: user.username, role: user.role } };
    } catch (e: any) {
      this.logger.error(`DB upsert failed, using fallback session: ${e.message}`, e.stack);
      // Fallback: сессия в памяти + Redis
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = this.hash(rawToken);
      const fallbackUser: FallbackSessionUser = { id: 'fallback-owner', telegramUserId: ownerBigInt.toString(), username: login, role: 'OWNER' };
      this.fallbackSessions.set(tokenHash, fallbackUser);
      if (this.redis) {
        try { await this.redis.set(`fallback_session:${tokenHash}`, JSON.stringify(fallbackUser), 'EX', 7*24*60*60); } catch {}
      }
      return { rawToken, user: { telegramUserId: fallbackUser.telegramUserId, username: fallbackUser.username, role: fallbackUser.role } };
    }
  }

  private redisKey(token: string){ return `bot_login:${token}`; }

  async createBotLoginRequest() {
    const ownerTelegramId = (process.env.OWNER_TELEGRAM_ID || '').trim();
    if (!ownerTelegramId) throw new UnauthorizedException('OWNER_TELEGRAM_ID missing');
    const token = randomBytes(24).toString('hex');
    const pending: PendingBotLogin = { token, approved: false, createdAt: Date.now() };
    this.pendingBotLogins.set(token, pending);
    if (this.redis) { try { await this.redis.set(this.redisKey(token), JSON.stringify(pending), 'EX', 600); } catch {} }
    await this.telegramApi.sendMessage(ownerTelegramId, 'Подтвердить вход в админ-панель СВОЙ?', { inline_keyboard: [[{ text: '✅ Да, это я', callback_data: `approve_login:${token}` }, { text: '❌ Нет', callback_data: `deny_login:${token}` }]] });
    return { token };
  }

  private async getPending(token: string): Promise<PendingBotLogin | null> {
    if (this.redis) { try { const raw = await this.redis.get(this.redisKey(token)); if (raw) { const p = JSON.parse(raw); this.pendingBotLogins.set(token, p); return p; } } catch {} }
    return this.pendingBotLogins.get(token) || null;
  }
  private async setPending(token: string, data: PendingBotLogin){ this.pendingBotLogins.set(token, data); if (this.redis){ try{ await this.redis.set(this.redisKey(token), JSON.stringify(data), 'EX', 600);}catch{} } }
  private async delPending(token: string){ this.pendingBotLogins.delete(token); if(this.redis){ try{ await this.redis.del(this.redisKey(token)); }catch{} } }

  async approveBotLogin(token: string){
    const pending = await this.getPending(token);
    if (!pending) return false;
    if (Date.now() - pending.createdAt > 10*60*1000){ await this.delPending(token); return false; }
    const ownerIdRaw = (process.env.OWNER_TELEGRAM_ID || '').trim();
    if (!ownerIdRaw) return false;
    let ownerBigInt: bigint; try{ ownerBigInt = BigInt(ownerIdRaw); }catch{ return false; }
    try{
      const user = await this.prisma.user.upsert({ where:{ telegramUserId: ownerBigInt }, update:{ role:'OWNER' }, create:{ telegramUserId: ownerBigInt, role:'OWNER' } });
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = this.hash(rawToken);
      await this.prisma.session.create({ data:{ userId:user.id, tokenHash, expiresAt:new Date(Date.now()+7*24*60*60*1000) } });
      pending.approved=true; pending.rawToken=rawToken; pending.user={ telegramUserId:user.telegramUserId.toString(), username:user.username, role:user.role };
      await this.setPending(token, pending); return true;
    }catch(e:any){
      this.logger.error(`approveBotLogin DB failed, fallback: ${e.message}`);
      // Fallback тоже
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = this.hash(rawToken);
      const fallbackUser = { id:'fallback-owner', telegramUserId: ownerBigInt.toString(), username:'owner', role:'OWNER' };
      this.fallbackSessions.set(tokenHash, fallbackUser as any);
      if(this.redis){ try{ await this.redis.set(`fallback_session:${tokenHash}`, JSON.stringify(fallbackUser), 'EX', 7*24*60*60);}catch{} }
      pending.approved=true; pending.rawToken=rawToken; pending.user={ telegramUserId:fallbackUser.telegramUserId, username:fallbackUser.username, role:fallbackUser.role };
      await this.setPending(token, pending); return true;
    }
  }

  async denyBotLogin(token: string){ const p = await this.getPending(token); if(!p) return false; await this.delPending(token); return true; }

  async getBotLoginStatus(token: string){
    const pending = await this.getPending(token);
    if(!pending) return { found:false, approved:false };
    if(Date.now()-pending.createdAt>10*60*1000){ await this.delPending(token); return { found:false, approved:false }; }
    return { found:true, approved:pending.approved, rawToken:pending.rawToken, user:pending.user };
  }

  async consumeBotLogin(token: string){
    const pending = await this.getPending(token);
    if(!pending?.approved || !pending.rawToken || !pending.user) return null;
    await this.delPending(token);
    return { rawToken: pending.rawToken, user: pending.user };
  }

  async logout(rawToken?: string){
    if(!rawToken) return;
    const h = this.hash(rawToken);
    this.fallbackSessions.delete(h);
    if(this.redis){ try{ await this.redis.del(`fallback_session:${h}`);}catch{} }
    try{ await this.prisma.session.deleteMany({ where:{ tokenHash:h } }); }catch{}
  }

  async resolveSession(rawToken?: string){
    if(!rawToken) return null;
    const h = this.hash(rawToken);
    // 1. Redis fallback
    if(this.fallbackSessions.has(h)) return this.fallbackSessions.get(h) as any;
    if(this.redis){
      try{
        const raw = await this.redis.get(`fallback_session:${h}`);
        if(raw){ const u = JSON.parse(raw); this.fallbackSessions.set(h, u); return u as any; }
      }catch{}
    }
    // 2. DB
    try{
      const session = await this.prisma.session.findUnique({ where:{ tokenHash:h }, include:{ user:true } });
      if(!session || session.expiresAt < new Date()) return null;
      return session.user;
    }catch{ return null; }
  }

  private hash(v:string){ return createHash('sha256').update(v).digest('hex'); }
}
