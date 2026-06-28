# Production deployment — СВОЙ

## Services
- postgres
- redis
- api
- worker
- admin
- nginx

## Run
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## Required setup
1. Fill `apps/api/.env`
2. Fill `apps/admin/.env`
3. Run migrations inside api container or before first boot
4. Point domain to nginx
5. Configure HTTPS via reverse proxy / certbot / cloud load balancer

## Production improvements included
- api container includes `ffmpeg`
- shared persistent volume for media storage
- static files served from `/storage/`
- worker retries failed publish after 5 minutes
- publish-now endpoint available

## Notes
- nginx routes `/` to admin and `/api/` to backend
- webhook URL should use public HTTPS backend URL
- for production cookies set `secure: true` behind HTTPS
- image watermark works via sharp
- video watermark uses ffmpeg if available
