# СВОЙ — Полная платформа

Telegram bot platform + медиа-система «СВОЙ»

## Структура

```
svoy/
├── backend/     ← NestJS + Prisma + Docker
├── admin/       ← Next.js 14 админ-панель
└── README.md
```

## Быстрый старт

### Backend
```bash
cd backend
cp .env.example .env
# Заполни TELEGRAM_BOT_TOKEN и другие секреты

docker-compose up -d
```

### Admin
```bash
cd admin
npm install
npm run dev
```

## Деплой

- **Backend**: Docker на VPS
- **Admin**: Vercel

Подробности в папках `backend/` и `admin/`.

## Владелец

Telegram ID: 7320418026
```

## Создаю .gitignore для монорепо