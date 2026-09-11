# fanta-reminder

Base MVP Expo (iOS/Android) per reminder fantacalcio prima della giornata di Serie A.

## Avvio

```bash
npm install
npx expo start
```

## Web + CORS (football-data)

Per usare dati reali su web, avvia il proxy locale in un terminale:

```bash
npm run proxy
```

Poi avvia la web app in un secondo terminale:

```bash
npm run web
```

## Build Android APK (EAS)

```bash
eas login
eas build -p android --profile preview-apk
```

Il profilo `preview-apk` genera un file `.apk` installabile.

## Refresh giornaliero calendario (Android)

L'app registra un task background che prova a sincronizzare il calendario una volta al giorno e ripianifica le notifiche locali.

## Config

1. Copia `.env.example` in `.env`
2. Imposta `EXPO_PUBLIC_FOOTBALL_DATA_API_KEY`

Senza API key, l'app usa dati demo locali.

## Struttura

- `App.tsx`: UI MVP (Home, Impostazioni, Calendario)
- `src/services/serieA.ts`: lettura calendario Serie A
- `src/services/notifications.ts`: permessi push + token Expo
- `src/storage/preferences.ts`: preferenze locali
- `supabase/sql/schema.sql`: schema DB iniziale
- `supabase/functions/*`: placeholder edge functions
