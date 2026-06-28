# Release checklist — СВОЙ

## Before release
- [ ] `.env` files validated
- [ ] `npm run test` passed in api
- [ ] `npm run build` passed in admin
- [ ] database backup created
- [ ] prisma migrations reviewed
- [ ] owner login checked
- [ ] Telegram webhook checked
- [ ] bot is admin in required channels
- [ ] sample content published successfully
- [ ] storage volume mounted
- [ ] ffmpeg available
- [ ] health endpoints green
- [ ] Swagger `/docs` reachable
- [ ] CI green

## After release
- [ ] create smoke test intake
- [ ] create smoke content item
- [ ] run publish now
- [ ] verify audit log entries
- [ ] verify moderation endpoint works
