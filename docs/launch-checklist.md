# Launch checklist — СВОЙ

## 1. BotFather
- Создайте бота
- Получите token
- Запомните username
- Настройте домен для Telegram Login Widget

## 2. Infra
```bash
docker compose up -d
```

## 3. Backend env
Заполните `apps/api/.env` на основе `.env.example`

Обязательно:
- `DATABASE_URL`
- `REDIS_URL`
- `OWNER_TELEGRAM_ID=7320418026`
- `TELEGRAM_LOGIN_BOT_TOKEN`
- `MASTER_BOT_TOKEN`
- `MASTER_BOT_USERNAME`
- `MASTER_BOT_KEY=master`
- `WEBHOOK_BASE_URL=https://api.your-domain.com`
- `WEBHOOK_SECRET=random-secret`

## 4. Backend install
```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

## 5. Admin env
Заполните `apps/admin/.env`
- `NEXT_PUBLIC_API_URL=http://localhost:3001`
- `NEXT_PUBLIC_BOT_USERNAME=your_bot_username`

## 6. Admin install
```bash
cd apps/admin
npm install
npm run dev
```

## 7. Login
- Откройте admin panel
- Войдите через Telegram Login Widget
- Войти сможет только owner `7320418026`

## 8. Webhook
После входа нажмите в панели кнопку:
- `Настроить webhook`

Или вызовите:
```bash
curl -X POST http://localhost:3001/admin/setup/master-bot --cookie "svoy_admin_session=..."
```

## 9. Тест бота
- Откройте бота
- Нажмите `/start`
- Пройдите все 5 сценариев
- Отправьте text/photo/video
- Убедитесь, что заявки попали в админку

## 10. RSS
- Добавьте RSS источник в панели
- Нажмите `Fetch`
- Убедитесь, что записи появились в `content`

## 11. Moderation
- Укажите chat id / target telegram id
- Используйте WARN / MUTE / BAN / DELETE
- Проверьте историю moderation
