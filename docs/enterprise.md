# Enterprise version — СВОЙ

## Что добавлено
- health endpoints
- audit log
- soft delete
- pagination DTO
- search filters on backend
- S3-ready storage abstraction
- queue-driven publish enqueue foundation

## Health
- `GET /health`
- `GET /health/ready`

## Audit
- `GET /audit`
- фиксируются действия над users/content

## Soft delete
Добавлены поля `deletedAt` в основные сущности.
Удаление теперь безопасное и обратимое на уровне данных.

## Pagination / Search
Поддерживается через query params:
- `page`
- `limit`
- `q`

Применено в:
- users
- intakes
- content
- audit

## Storage abstraction
- `STORAGE_DRIVER=local|s3`
- local сохраняет на диск
- s3 mode пока return-ready abstraction, куда можно подставить AWS SDK / MinIO client

## Queue foundation
При schedule/publish-now создаётся enqueue в BullMQ queue `publishing`.
Текущий worker остаётся как fallback poller + retry.

## Дальше для настоящего enterprise
- AWS SDK / MinIO integration
- background consumer on BullMQ Worker
- structured logging (pino)
- metrics / Prometheus
- OpenTelemetry tracing
- RBAC beyond owner-only UI
- per-channel ACL
- migrations checked into repo
- CI/CD pipelines
