# SamInvest — Frontend

Samarqand viloyati Investitsiyalar, sanoat va savdo boshqarmasi (**saminvestcompany.uz**) rasmiy portali. Ko'p tilli axborot portali + admin panel.

## Texnologiyalar

- **Next.js 16** (App Router), **React 19**
- **Tailwind CSS v4** + **shadcn/ui** + Radix
- **next-intl** — 4 til: `uz` (lotin, default), `oz` (kirill), `ru`, `en`
- **TanStack Query** + **axios** (backend bilan)
- **Yandex Maps** (kalkulyator xaritasi)
- Chat: **Crisp emas** — o'z Telegram-chat vidjeti

## Asosiy imkoniyatlar

- **Ommaviy portal:** bosh sahifa, yangiliklar/tadbirlar/e'lonlar, foto/video galereya, dinamik menyu sahifalari
- **Infratuzilma yig'imi kalkulyatori** (`/[locale]/calc`) — VM 151-son qarori (08.04.2026) bo'yicha:
  - Yandex xaritada joyni tanlash → aholi bo'yicha **Кз avtomatik**
  - Koeffitsientlar tanlanadi, bosqichma-bosqich hisob-kitob, 4 tilда
- **Telegram onlayn chat** vidjeti (barcha ommaviy sahifalarда)
- **Admin panel** (`/[locale]/admin`) — menyu, nashrlar, galereya, sozlamalar

## Ishga tushirish

```bash
pnpm install
# .env.local yarating (pastda)
pnpm dev            # http://localhost:3000
```

Til prefiksli manzillar: `/uz`, `/oz`, `/ru`, `/en` (masalan `/uz/calc`).

## Environment (`.env.local`)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:1248          # prod: https://api.saminvestcompany.uz
NEXT_PUBLIC_YANDEX_API_KEY=...                          # Yandex Maps JavaScript API kaliti
```

> ⚠️ `NEXT_PUBLIC_*` env'lar **build vaqtida** muhrlanadi — productionда `pnpm build`дан **oldin** o'rnating.

## Tuzilma

```
src/
├── app/[locale]/
│   ├── (public)/       # portal: bosh, calc, galereya, publication, [menu]
│   ├── (admin)/        # admin panel
│   └── login/
├── components/         # calc/, chatbot/, header/, footer/, admin/, ui/ ...
├── i18n/               # next-intl (routing, request)
├── models/axios.ts     # API instance
└── proxy.ts            # middleware (auth + i18n)
messages/               # uz.json · oz.json · ru.json · en.json
```

## Ko'p tillilik (i18n)

- Tarjimalar `messages/<locale>.json`da. Kalkulyator — `calc` namespace ostида.
- `oz` (kirill) — `uz` (lotin)dан transliteratsiya orqali hosil qilingan.
- Komponentда: `const t = useTranslations('calc'); t('title')`.

## Production deploy

pm2 + nginx bo'yicha to'liq yo'riqnoma: repo ildizidagi **`DEPLOY.md`**.
