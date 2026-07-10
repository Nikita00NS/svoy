# DevOps & QA pack — СВОЙ

## Added
- env validation via zod
- Swagger docs at `/docs`
- in-memory rate limiting middleware
- basic Node test scaffold
- GitHub Actions CI workflow
- health endpoints
- production notes for migrations and backup

## Swagger
- Open `GET /docs`

## Validation
Invalid env will fail app startup early.

## Rate limiting
Current middleware:
- 120 requests / minute / path / ip
- in-memory

For production scale replace with Redis-backed limiter.

## Tests
Current scaffold:
- `apps/api/test/health.spec.js`

Run:
```bash
cd apps/api
npm run test
```

## CI
Workflow file:
- `.github/workflows/ci.yml`

Checks:
- api install + tests
- admin install + build

## Migration guide
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
# or
npx prisma migrate deploy
```

## Backup notes
### PostgreSQL dump
```bash
pg_dump "$DATABASE_URL" > backup.sql
```

### Restore
```bash
psql "$DATABASE_URL" < backup.sql
```

### Media backup
Back up your storage volume:
- local volume `svoy_storage`
- or S3 bucket when enabled
