import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.string().default('3001'),
  APP_URL: z.string().optional(),
  ADMIN_URL: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  OWNER_TELEGRAM_ID: z.string(),
  TELEGRAM_LOGIN_BOT_TOKEN: z.string().optional(),
  COOKIE_NAME: z.string().default('svoy_admin_session'),
  MASTER_BOT_TOKEN: z.string().optional(),
  MASTER_BOT_USERNAME: z.string().optional(),
  MASTER_BOT_KEY: z.string().default('master'),
  WEBHOOK_BASE_URL: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  RSS_FETCH_INTERVAL_MINUTES: z.string().default('10'),
  DEFAULT_WATERMARK_TEXT: z.string().default('СВОЙ'),
  STORAGE_DIR: z.string().default('/home/user/svoy_storage'),
  STORAGE_DRIVER: z.string().default('local'),
  S3_BUCKET: z.string().default('svoy'),
  FFMPEG_PATH: z.string().default('ffmpeg'),
  // Новые переменные для входа по паролю
  ADMIN_LOGIN: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().optional(),
});

export function validateEnv(config: Record<string, unknown>) {
  return envSchema.parse(config);
}
