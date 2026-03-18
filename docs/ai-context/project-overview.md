# Project Overview

## Obiettivo del prodotto

`wallet-app` e una web app per la gestione del budget personale con estensioni collaborative. L'utente autenticato puo:

- monitorare saldo, entrate e spese mensili;
- registrare manualmente movimenti di entrata e uscita;
- definire entrate ricorrenti e materializzarle come transazioni reali;
- creare obiettivi di risparmio e registrare contributi;
- gestire gruppi con spese condivise, quote individuali e rimborsi.

L'app e pensata come base full-stack pronta a crescere, non come MVP puramente statico: il progetto ha gia servizi separati, tipi forti, validazioni Zod, API JSON e schema SQL dedicato.

## Stack tecnico

- Next.js 15 con App Router.
- React 19.
- TypeScript strict mode.
- Tailwind CSS.
- Supabase SSR per auth e accesso dati.
- Postgres/Supabase come persistence layer.
- Zod per validazione input.
- Vitest per test unitari.

## Moduli funzionali presenti

- `Dashboard`: riepilogo del mese corrente, categorie top, attivita recente, stato saving goals e calcolo budget giornaliero.
- `Transactions`: CRUD di transazioni manuali per entrate e spese con filtri per mese, categoria e tipo.
- `Recurring Incomes`: definizione di ricorrenze e generazione di transazioni future o arretrate senza duplicati.
- `Saving Goals`: creazione goal con target e scadenza, piu contributi manuali cumulativi.
- `Group Expenses`: gruppi, membri registrati o guest, spese condivise, quote e workflow di settlement.

## Esperienza utente attuale

- Pagina iniziale `/` che redirige automaticamente a `/dashboard` o `/login`.
- Login con Google OAuth via Supabase.
- Shell autenticata con header, sidebar desktop e bottom navigation mobile.
- Ogni sezione dashboard usa fetching server-side iniziale e, quando serve, aggiornamenti client via `fetch` verso `/api/...`.
- UI in italiano, con naming tecnico talvolta misto inglese/italiano.

## Flussi principali

### Autenticazione

1. L'utente avvia login Google da `/login`.
2. Supabase completa il callback su `/auth/callback`.
3. Ogni volta che viene letto l'utente autenticato, `ensureUserProfile` crea o aggiorna il record in `public.users`.
4. Il layout protetto reindirizza al login se la sessione non esiste.

### Gestione dati

1. Le pagine server leggono dati dai service layer.
2. I componenti client interattivi usano le API interne `/api/...` per create/update/toggle.
3. I service layer parlano con Supabase e incapsulano mapping tra righe database e tipi frontend.
4. Le validazioni avvengono con Zod prima di arrivare alla logica di dominio.

### Dashboard

1. Legge transazioni del mese corrente.
2. Legge ricorrenze attive con occorrenze entro fine mese per stimare entrate future.
3. Legge budget mensile e saving goals.
4. Calcola KPI aggregati e segnali di budget.

## Stato di maturita percepito

Il progetto e gia oltre la fase di scaffold iniziale: ha domini reali e logica di business non banale. Allo stesso tempo, alcune aree mostrano spazio di espansione:

- budget mensile presente a livello dati ma poco esposto a livello UI;
- alcune enum SQL supportano casi non ancora usati dalla UI;
- i test coprono oggi soprattutto la formula del budget giornaliero;
- non ci sono ancora workflow avanzati di editing per tutti i domini.

## Cartelle chiave

- `app/`: route Next.js, pagine, layout, server actions e API handlers.
- `components/`: UI e workspace dei domini.
- `services/`: logica server-side per ogni dominio.
- `lib/`: calcoli, helper Supabase, validazioni e utility.
- `types/`: modelli TypeScript derivati dal dominio e dal database.
- `supabase/`: schema SQL e migrazioni manuali del progetto.
- `tests/`: test unitari presenti.
