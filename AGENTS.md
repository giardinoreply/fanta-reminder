# AGENTS

## Obiettivo

Mantenere la codebase semplice, leggibile e scalabile con approccio SoC + KISS.

## Principi

- Separa orchestration, stato, UI, servizi e persistenza.
- Evita astrazioni premature e refactor non richiesti.
- Ogni file deve avere responsabilità chiara.
- Preferisci modifiche piccole e locali.

## Struttura da rispettare

- `src/app`: composizione app e wiring alto livello.
- `src/hooks`: stato e use-case applicativi.
- `src/common`: codice riusabile e generico (componenti base, constants, utils).
- `src/components`: componenti di dominio/feature.
- `src/services`: integrazioni API, notifiche, background tasks.
- `src/storage`: accesso a persistenza locale.
- `src/types`: tipi condivisi trasversali.

## Convenzioni

- Riutilizzabile/elementare -> `common`.
- Specifico di feature -> `components`.
- Nessuna logica business complessa nei componenti presentazionali.
- Formattazione data/tempo in `common/utils`.
- Testo/chiavi sezione in `common/constants`.

## Guardrail

- Non inserire segreti nel repository.
- Non introdurre path assoluti locali.
- Mantieni compatibilità Android come priorità.
- Web è supporto secondario (proxy locale per CORS).

## Checklist prima di chiudere una modifica

- I file toccati rispettano la responsabilità del folder.
- Nessuna duplicazione evidente di logica.
- Le dipendenze nuove sono motivate.
- README aggiornato se cambia comportamento/comandi.
