# Final handoff pack — СВОЙ

## 1. Что входит в проект
### Backend (`apps/api`)
- NestJS API
- Prisma + PostgreSQL
- Telegram webhook bot
- Auth via Telegram Login Widget
- Owner-only access
- Moderation
- Content pipeline
- Media download + watermark
- RSS ingest
- Worker publishing
- Audit / Health / Swagger

### Admin (`apps/admin`)
- Next.js admin panel
- Telegram login
- Users / Intakes / Channels / Bots / Content / Moderation / RSS / Audit

## 2. Структура
- `apps/api` — backend
- `apps/admin` — frontend
- `docs` — документация
- `docker-compose.yml` — dev infra
- `docker-compose.prod.yml` — prod infra
- `.github/workflows/ci.yml` — CI

## 3. Все env
### apps/api/.env
- `PORT`
- `APP_URL`
- `ADMIN_URL`
- `DATABASE_URL`
- `REDIS_URL`
- `OWNER_TELEGRAM_ID`
- `TELEGRAM_LOGIN_BOT_TOKEN`
- `COOKIE_NAME`
- `MASTER_BOT_TOKEN`
- `MASTER_BOT_USERNAME`
- `MASTER_BOT_KEY`
- `WEBHOOK_BASE_URL`
- `WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `RSS_FETCH_INTERVAL_MINUTES`
- `DEFAULT_WATERMARK_TEXT`
- `STORAGE_DIR`
- `STORAGE_DRIVER`
- `S3_BUCKET`
- `FFMPEG_PATH`

### apps/admin/.env
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_BOT_USERNAME`

## 4. Запуск локально
### Infra
```bash
docker compose up -d
```

### API
```bash
cd apps/api
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

### Admin
```bash
cd apps/admin
cp .env.example .env
npm install
npm run dev
```

## 5. Деплой
### GitHub
1. Создайте новый репозиторий
2. Загрузите содержимое папки `svoy`
3. Запушьте в `main`

### Vercel
Подходит прежде всего для `apps/admin`.
Backend NestJS лучше деплоить отдельно:
- Railway
- Render
- Fly.io
- VPS
- Docker server

### Вариант подключения Vercel
- Root Directory: `apps/admin`
- Framework: Next.js
- Env:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_BOT_USERNAME`

## 6. Что проверить после деплоя
- `/health`
- `/health/ready`
- `/docs`
- вход в admin
- `/start` у бота
- intake flow
- setup webhook
- content publish now
- scheduled publish
- audit entries

## 7. Техдолг / следующие улучшения
- настоящий S3 client
- BullMQ worker consumer
- расширенные тесты
- metrics / tracing
- RBAC по ролям в UI
- редактор контента с preview

## 8. Roadmap
### v1.1
- richer editor
- file previews
- publish history

### v1.2
- real S3
- Redis rate limit
- queue worker separation

### v2.0
- multi-admin RBAC
- analytics
- campaign reporting
