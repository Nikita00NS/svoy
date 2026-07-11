# Migrations guide — СВОЙ

## Development
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
```

## Production
```bash
cd apps/api
npx prisma generate
npx prisma migrate deploy
```

## Seed
```bash
npm run seed
```

## Important
- Always back up DB before production deploy
- Review Prisma diff before applying
- Commit your migration files in real repo usage
