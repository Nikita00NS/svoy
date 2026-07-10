# Release Candidate pack — СВОЙ

## Added
- semantic RC versioning (`1.0.0-rc.1`)
- prettier-based format/lint scripts
- structured JSON logger
- global exception filter
- standard response envelope
- release checklist

## Response format
Success:
```json
{
  "success": true,
  "data": {},
  "timestamp": "..."
}
```

Error:
```json
{
  "success": false,
  "statusCode": 400,
  "path": "/...",
  "error": "...",
  "timestamp": "..."
}
```

## Logger
Logs are JSON-like and easier to ingest by log platforms.

## Release flow
1. Validate env
2. Run tests
3. Build api/admin
4. Run migrations
5. Seed owner if needed
6. Deploy
7. Verify `/health`, `/health/ready`, `/docs`
8. Verify webhook setup
9. Verify bot flow and publishing
