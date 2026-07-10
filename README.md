# СВОЙ

**СВОЙ** — release candidate платформы управления Telegram-каналами с рабочим Telegram-ботом, owner-only админкой, moderation, контент-потоком, RSS и публикацией в каналы.

## RC features
- semantic version: `1.0.0-rc.1`
- Swagger `/docs`
- health endpoints
- audit log
- rate limiting
- response envelope
- global exception handling
- JSON logger
- CI workflow
- release checklist

## Main docs
- `docs/production.md`
- `docs/enterprise.md`
- `docs/devops-qa-pack.md`
- `docs/release-candidate.md`
- `docs/release-checklist.md`
- `docs/migrations.md`

## Run production
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## Owner
- `7320418026`
