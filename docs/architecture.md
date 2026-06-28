# Архитектура «СВОЙ»

## 1. Telegram bot
- webhook only
- inline menu
- intake flow
- channel post hooks

## 2. Backend
- NestJS API
- Prisma ORM
- PostgreSQL
- Cookie session auth
- Telegram Login verification
- OwnerGuard

## 3. Admin
- Next.js
- Telegram Login Widget
- вкладки: dashboard / intakes / channels / bots / content / moderation / rss

## 4. Domain modules
- `intakes` — пользовательские обращения
- `content` — редактура и публикационный lifecycle
- `moderation` — delete/warn/mute/ban
- `rss` — импорт новостей
- `queues` — BullMQ foundation
- `ai` — переписывание текста

## 5. Security
- owner-only доступ по `telegram_user_id`
- bot token только в env
- webhook secret header validation

## 6. Roadmap hardening
- storage layer
- media watermark workers
- scheduled publishing workers
- per-channel permissions
- observability/logging
