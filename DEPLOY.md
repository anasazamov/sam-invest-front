# SamInvest — Production deploy (pm2 + nginx)

VPS'da pm2 orqali deploy. Backend `api.saminvestcompany.uz`, frontend `www.saminvestcompany.uz`.

> Avvalgi versiya allaqachon pm2 bilan ishlaganini inobatga olib — bu yerda asosan
> **yangi kodni chiqarish + yangi env/migrate/deps** ko'rsatilgan.

---

## 0. Bu versiyada nima yangi (deploy'da e'tibor bering)

| Yangi | Nima qilish kerak |
|------|-------------------|
| Backend deps: `web-push`, `@nestjs/schedule` | `pnpm install` (frozen emas) |
| Yangi env: `TELEGRAM_*`, `VAPID_*`, `STAT_POPULATION_URL` | `.env`ga qo'shish |
| Yangi migratsiyalar (chat, territory, ...) | `prisma migrate deploy` |
| Aholi bazasi seed | `node prisma/seed-territories.mjs` (bir marta) |
| Chat **SSE** oqimi | nginx'da `proxy_buffering off` |
| Telegram **webhook** | `TELEGRAM_WEBHOOK_URL` + startда avto o'rnatiladi |
| Frontend env: `NEXT_PUBLIC_YANDEX_API_KEY` | **build'dan oldin** o'rnatish |

---

## 1. Backend deploy (`api.saminvestcompany.uz`)

```bash
cd /var/www/sam-invest-backend     # o'z yo'lingiz
git pull origin main

# Bog'liqliklar (web-push, @nestjs/schedule qo'shiladi)
pnpm install

# .env ni to'ldiring (pastdagi shablon)
nano .env

# Prisma: client + migratsiya + (bir marta) seed
pnpm prisma generate
pnpm prisma migrate deploy
node prisma/seed-territories.mjs      # faqat birinchi marta yoki aholi yangilashда

# Build
pnpm build                            # dist/src/main.js

# pm2 (birinchi marta)
pm2 start dist/src/main.js --name saminvest-api --time
# yoki yangilashда
pm2 restart saminvest-api
pm2 save
```

### Backend `.env` (production)
```env
DATABASE_URL="postgresql://saminvest:PAROL@localhost:5432/saminvest?schema=public"
PORT=1248
JWT_SECRET=<uzun_maxfiy_tasodifiy_satr>

# Telegram  (⚠️ haqiqiy token faqat .env faylda — hujjatga yozilmaydi)
TELEGRAM_BOT_TOKEN=<bot_token_bu_yerga>
TELEGRAM_SUPERADMIN_ID=<superadmin_chat_id>
TELEGRAM_WEBHOOK_URL=https://api.saminvestcompany.uz/chat/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=<uzun_tasodifiy_secret>

# Web Push (generatsiya: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=<vapid_public_key>
VAPID_PRIVATE_KEY=<vapid_private_key>
VAPID_SUBJECT=mailto:admin@saminvestcompany.uz

# Aholi statistikasi (bo'sh bo'lsa seed ishlatiladi)
STAT_POPULATION_URL=
```

> VAPID kalitlarini bir marta yarating: `npx web-push generate-vapid-keys` → natijani `.env`ga.

---

## 2. Frontend deploy (`www.saminvestcompany.uz`)

⚠️ **`NEXT_PUBLIC_*` env'lar build vaqtida "muhrlanadi"** — shuning uchun **build'dan oldin** o'rnating.

```bash
cd /var/www/sam-invest-front
git pull origin main

# .env.production (build'dan oldin!)
nano .env.production

pnpm install
pnpm build                            # .next

# pm2 (birinchi marta)
pm2 start "node node_modules/next/dist/bin/next start -p 3000" --name saminvest-web --time
# yoki
pm2 restart saminvest-web
pm2 save
```

### Frontend `.env.production`
```env
NEXT_PUBLIC_BACKEND_URL=https://api.saminvestcompany.uz
NEXT_PUBLIC_YANDEX_API_KEY=<yandex_maps_api_key>   # domenga cheklangan bo'lsin
```

---

## 3. nginx

### `api.saminvestcompany.uz` (backend)
```nginx
server {
    listen 443 ssl;
    server_name api.saminvestcompany.uz;

    ssl_certificate     /etc/letsencrypt/live/api.saminvestcompany.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.saminvestcompany.uz/privkey.pem;

    client_max_body_size 100M;   # fayl yuklash uchun

    location / {
        proxy_pass http://127.0.0.1:1248;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Chat SSE (real-time) uchun MUHIM:
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
    }
}
server {
    listen 80; server_name api.saminvestcompany.uz;
    return 301 https://$host$request_uri;
}
```

### `www.saminvestcompany.uz` (frontend)
```nginx
server {
    listen 443 ssl;
    server_name saminvestcompany.uz www.saminvestcompany.uz;

    ssl_certificate     /etc/letsencrypt/live/saminvestcompany.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/saminvestcompany.uz/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
server {
    listen 80; server_name saminvestcompany.uz www.saminvestcompany.uz;
    return 301 https://$host$request_uri;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
# SSL bo'lmasa: sudo certbot --nginx -d api.saminvestcompany.uz
```

---

## 4. Telegram webhook — tekshirish

Backend startда `TELEGRAM_WEBHOOK_URL` bo'yicha webhook **avtomatik** o'rnatiladi. Tekshiring:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
# url = https://api.saminvestcompany.uz/chat/telegram/webhook, last_error yo'q bo'lsin
```

So'ng: superadmin botга **/start** bossin (bot unga yoza olishi uchun).

---

## 5. Keyingi yangilashlar (qisqa)

```bash
# backend
cd /var/www/sam-invest-backend && git pull && pnpm install && \
  pnpm prisma migrate deploy && pnpm build && pm2 restart saminvest-api

# frontend  (env o'zgarsa .env.production'ni yangilang, keyin)
cd /var/www/sam-invest-front && git pull && pnpm install && \
  pnpm build && pm2 restart saminvest-web
```

---

## 6. Tekshiruv ro'yxati (deploy'dan keyin)

- [ ] `pm2 status` — `saminvest-api` va `saminvest-web` `online`
- [ ] `curl https://api.saminvestcompany.uz/` → "Hello World!"
- [ ] `https://www.saminvestcompany.uz/uz/calc` ochiladi, xarita ko'rinadi
- [ ] Saytда chat tugmasi → xabar → Telegramга keladi
- [ ] Operator botда **✍️ Qabul qilish** → javob → saytда jonli ko'rinadi
- [ ] `getWebhookInfo` — url to'g'ri, xato yo'q
- [ ] Bosh sahifada "Kalkulyatorni ochish" tugmasi bor
```
```
