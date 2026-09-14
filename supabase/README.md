# Supabase Backend Setup

Questo backend copre:

- sync calendario Serie A (`sync_serie_a_matches`)
- invio push server-side (`send_due_notifications`)
- upsert device/preferenze (`upsert_device_preferences`)
- gestione "giornata fatta" (`set_matchday_dismissal`)
- stato giornata Fantacalcio (`fanta_get_status`)
- invio formazione Fantacalcio (`fanta_submit_lineup`)

## 1) Prerequisiti

- progetto Supabase creato
- accesso CLI via `npx supabase`
- Expo Push Token raccolto dall'app

## 2) Applica schema DB

Esegui SQL da `supabase/sql/schema.sql` nel SQL editor del progetto.

## 3) Deploy funzioni

```bash
npx supabase functions deploy sync_serie_a_matches
npx supabase functions deploy send_due_notifications
npx supabase functions deploy upsert_device_preferences
npx supabase functions deploy set_matchday_dismissal
npx supabase functions deploy fanta_get_status
npx supabase functions deploy fanta_submit_lineup
```

## 4) Secrets richiesti

```bash
npx supabase secrets set FOOTBALL_DATA_API_KEY=your_football_data_key
npx supabase secrets set CLIENT_WRITE_KEY=your_private_client_write_key
```

`CLIENT_WRITE_KEY` e' opzionale ma raccomandata. Se presente, le function write accettano solo richieste con header `x-client-key`.

## 5) Cron jobs (consigliati)

Nel repository trovi anche `supabase/sql/cron_jobs.sql` pronto da applicare.

Le function `sync_serie_a_matches` e `send_due_notifications` sono deployate con `--no-verify-jwt`,
quindi i job cron possono chiamarle senza bearer token.

```sql
select cron.schedule(
  'sync-serie-a-every-6h',
  '0 */6 * * *',
  $$
  select net.http_post(
    url:='https://<PROJECT_REF>.supabase.co/functions/v1/sync_serie_a_matches',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

select cron.schedule(
  'send-reminders-every-2m',
  '*/2 * * * *',
  $$
  select net.http_post(
    url:='https://<PROJECT_REF>.supabase.co/functions/v1/send_due_notifications',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

Se preferisci, puoi schedulare le stesse chiamate da GitHub Actions o altro scheduler esterno.

## 6) Payload function write

### `upsert_device_preferences` (POST)

```json
{
  "installationId": "device-installation-id",
  "expoPushToken": "ExponentPushToken[xxxxx]",
  "timezone": "Europe/Rome",
  "notificationsEnabled": true,
  "minutesBefore": 120,
  "leagueLockMinutes": 15,
  "repeatIntervalMinutes": 3,
  "maxExtraNotifications": 0
}
```

### `set_matchday_dismissal` (POST)

```json
{
  "installationId": "device-installation-id",
  "matchday": 4,
  "dismissed": true
}
```

Metti `dismissed: false` per riabilitare i reminder della giornata.

### `fanta_get_status` (POST)

```json
{
  "username": "user@example.com",
  "password": "your-password",
  "idSquadra": 123456,
  "idComp": 700001,
  "division": "A"
}
```

Restituisce `mday`, `cmday`, modulo attuale e `lineUpInfo` dal sito.

### `fanta_submit_lineup` (POST)

```json
{
  "username": "user@example.com",
  "password": "your-password",
  "idSquadra": 123456,
  "idComp": 700001,
  "division": "A",
  "spec": {
    "modulo": "433",
    "titolari": ["Giocatore 1", "..."],
    "panchina": ["Giocatore 12", "..."],
    "capitano": []
  }
}
```

La function valida la spec contro la rosa live e invia il payload al sito.
