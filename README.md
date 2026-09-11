# fanta-reminder

MVP Expo (focus Android) per promemoria Fantacalcio prima dell'inizio giornata Serie A.

## Setup

```bash
npm install
```

1. Copia `.env.example` in `.env`
2. Imposta `EXPO_PUBLIC_FOOTBALL_DATA_API_KEY`

Senza API key l'app usa fallback demo.

## Run

Avvio generico Expo:

```bash
npm run start
```

Android:

```bash
npm run android
```

Web (avvia automaticamente anche proxy locale CORS):

```bash
npm run web
```

Proxy stand-alone (solo se serve separato):

```bash
npm run proxy
```

## Build APK (EAS)

Login:

```bash
npx eas-cli login
```

Build APK installabile:

```bash
npx eas-cli build -p android --profile preview-apk
```

## Funzionalità attuali

- calendario Serie A con cache locale
- refresh giornaliero calendario in background (best effort)
- notifiche locali pianificate
- notifiche extra opzionali (intervallo + numero max)
- test notifiche immediate in-app
- sidebar desktop + drawer mobile

## Architettura `src`

- `src/app` orchestrazione pagina app
- `src/hooks` stato/azioni applicative
- `src/common` componenti/constant/util riusabili e generici
- `src/components` UI di dominio (navigation, sections)
- `src/services` integrazioni esterne e processi app (sync, notifiche, background)
- `src/storage` persistenza locale
- `src/types` tipi condivisi
