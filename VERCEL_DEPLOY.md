# Инструкция по деплою на Vercel

## Настройка проекта в Vercel Dashboard

1. **Root Directory**: Убедитесь, что в настройках проекта указан `whop-app` как Root Directory
   - Settings → General → Root Directory → `whop-app`

2. **Framework Preset**: Next.js (определяется автоматически)

## Обязательные переменные окружения

Добавьте следующие переменные в Vercel Dashboard (Settings → Environment Variables):

### Whop SDK (обязательно)
```
NEXT_PUBLIC_WHOP_APP_ID=your_app_id
WHOP_API_KEY=your_api_key
WHOP_WEBHOOK_SECRET=your_webhook_secret
```

**Важно**: `NEXT_PUBLIC_WHOP_APP_ID` должен быть доступен на клиенте (префикс `NEXT_PUBLIC_`), остальные только на сервере.

### Supabase (обязательно)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Опциональные (для уведомлений)
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
DISCORD_WEBHOOK_URL=your_discord_webhook_url
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="AutoChargeSaver <no-reply@autocharge.app>"
```

### Опциональные (для OAuth, если используется)
```
APP_BASE_URL=https://your-app.vercel.app
NEXT_PUBLIC_WHOP_CLIENT_ID=your_client_id
WHOP_CLIENT_SECRET=your_client_secret
WHOP_REDIRECT_URI=https://your-app.vercel.app/api/whop/oauth/callback
```

## После деплоя

1. Примените миграцию Supabase:
   - Откройте SQL Editor в Supabase Dashboard
   - Выполните содержимое `whop-app/supabase/migrations/000002_event_unify_and_rls.sql`

2. Настройте Webhook в Whop:
   - URL: `https://your-app.vercel.app/api/webhooks/whop`
   - Секрет: тот же, что в `WHOP_WEBHOOK_SECRET`

3. Проверьте работу:
   - Откройте приложение в Whop
   - Убедитесь, что дашборд загружается
   - Проверьте, что события сохраняются в Supabase

## Troubleshooting

- Если сборка падает с ошибкой переменных окружения - проверьте, что все обязательные переменные добавлены
- Если API возвращает 401 - проверьте, что `WHOP_API_KEY` и `NEXT_PUBLIC_WHOP_APP_ID` правильные
- Если события не сохраняются - проверьте `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`

