# СВОЙ Backend

Production-ready NestJS backend для Telegram-бота и медиа-платформы «СВОЙ».

## Быстрый старт

```bash
cp .env.example .env
# Заполните TELEGRAM_BOT_TOKEN, JWT_SECRET и т.д.

docker-compose up -d postgres redis minio
docker-compose build api worker
docker-compose up -d api worker

docker-compose exec api npx prisma migrate deploy
docker-compose exec api npm run prisma:seed
```

## Установка webhook

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=$TELEGRAM_WEBHOOK_BASE_URL/api/webhooks/telegram/master&secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

## Документация

- Swagger: `/api/docs`
- Health: `/health/ready`

## Важно

- Никогда не коммитьте `.env`
- Все секреты только через переменные окружения
- Owner Telegram ID: 7320418026
