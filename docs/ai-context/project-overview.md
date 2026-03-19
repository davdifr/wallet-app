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

- `Dashboard`: vista centrata su "quanto puoi spendere oggi", con daily budget, salvadanaio, categorie top, attivita recente e stato goal.
- `Transactions`: CRUD di transazioni manuali per entrate e spese con filtri per mese, categoria e tipo.
- `Recurring Incomes`: definizione di ricorrenze e generazione di transazioni future o arretrate senza duplicati.
- `Saving Goals`: creazione goal con target, priorita e contributi manuali, con previsione automatica del tempo al raggiungimento.
- `Piggy Bank`: dominio separato dai goal per fondi vincolati, con movimenti manuali e piano mensile automatico.
- `Group Expenses`: gruppi, membri registrati o guest, spese condivise, quote e workflow di settlement.
- `Category Catalog`: catalogo condiviso di categorie fisse con slug tecnico stabile, label italiana, icona e compatibilita legacy.

## Esperienza utente attuale

- Pagina iniziale `/` che redirige automaticamente a `/dashboard` o `/login`.
- Login con Google OAuth via Supabase.
- Shell autenticata con header, sidebar desktop e bottom navigation mobile.
- Ogni sezione dashboard usa fetching server-side iniziale e poi aggiornamenti client via `fetch` verso `/api/...` orchestrati da TanStack Query.
- La navigazione tra tab principali viene preriscaldata con prefetch di route e dati per ridurre i caricamenti percepiti.
- L'app espone metadata PWA, manifest e icone Apple; il layout mobile gestisce anche le safe area iPhone in modalita homescreen standalone.
- UI in italiano, con naming tecnico talvolta misto inglese/italiano.
- Transazioni, recurring incomes e dashboard usano un catalogo categorie condiviso con icone predefinite e fallback per dati storici non normalizzati.
- La dashboard e stata alleggerita: la card principale e il daily budget; il salvadanaio usa una card compatta con una modale unica di gestione.
- Il dominio gruppi ha aggiornamenti realtime per nuove spese condivise e settlement, usati per badge unread, navbar e riallineamento delle viste senza refresh manuale.
- La sezione spese di gruppo e stata resa piu navigabile: lista compatta, filtri locali, ordinamento locale e dettaglio spesa in modale.

## Flussi principali

### Autenticazione

1. L'utente avvia login Google da `/login`.
2. Supabase completa il callback su `/auth/callback`.
3. Ogni volta che viene letto l'utente autenticato, `ensureUserProfile` crea o aggiorna il record in `public.users`.
4. Il layout protetto reindirizza al login se la sessione non esiste.

### Gestione dati

1. Le pagine server leggono dati dai service layer.
2. I componenti client interattivi usano le API interne `/api/...` per create/update/toggle/delete.
3. TanStack Query gestisce cache, refetch, invalidazione e sincronizzazione cross-tab dei dati principali.
4. I service layer parlano con Supabase e incapsulano mapping tra righe database e tipi frontend.
5. Le validazioni avvengono con Zod prima di arrivare alla logica di dominio.
6. Il dominio categorie usa dual-read/dual-write: nuove scritture persistono anche `category_slug`, mentre lo storico continua a essere letto con compatibilita legacy.
7. Per il dominio `groups`, alcuni aggiornamenti collaborativi passano anche da Supabase Realtime oltre che da invalidazione e sync cross-tab.

### Dashboard

1. La page server legge i dati iniziali dal service e passa il payload serializzato al workspace client.
2. Il workspace client usa la query `dashboard` contro `/api/dashboard` per mantenere la vista calda e riallineata.
3. La dashboard legge transazioni del mese corrente, ricorrenze attive entro fine mese, salvadanaio e saving goals.
4. Calcola un daily budget prudenziale fino a fine mese e ne mostra i driver principali.

## Stato di maturita percepito

Il progetto e gia oltre la fase di scaffold iniziale: ha domini reali e logica di business non banale. Allo stesso tempo, alcune aree mostrano spazio di espansione:

- budget mensile presente a livello dati ma poco esposto a livello UI;
- alcune enum SQL supportano casi non ancora usati dalla UI;
- i test coprono budget giornaliero, validazioni salvadanaio, invalidazioni query e parte del dominio goal, ma restano limitati sui service con Supabase reale;
- non ci sono ancora workflow avanzati di editing per tutti i domini.

## Cartelle chiave

- `app/`: route Next.js, pagine, layout, server actions e API handlers.
- `components/`: UI e workspace dei domini.
- `services/`: logica server-side per ogni dominio.
- `lib/`: calcoli, helper Supabase, validazioni e utility.
- `types/`: modelli TypeScript derivati dal dominio e dal database.
- `supabase/`: schema SQL e migrazioni manuali del progetto.
- `tests/`: test unitari presenti.
