# Architecture

## Architettura generale

L'app segue una struttura abbastanza pulita a layer:

- `app/` per routing, layout, page assembly e route handlers;
- `components/` per presentazione e workspace client;
- `services/` per logica server-side e accesso dati;
- `lib/` per helper infrastrutturali, calcoli e validazioni;
- `types/` per contratti TypeScript del dominio e del database.

Il pattern dominante e:

1. una pagina server recupera dati iniziali dai service;
2. passa i dati a un workspace client;
3. il workspace usa modali e form per le mutazioni;
4. le mutazioni vanno a `/api/...` o Server Actions;
5. i service incapsulano la logica verso Supabase.

## Routing

### Route groups principali

- `app/(auth)`: login e layout auth.
- `app/(dashboard)`: area autenticata con shell condivisa.
- `app/api`: endpoint JSON per tutte le mutazioni e i refetch client.

### Route utente

- `/login`
- `/dashboard`
- `/transactions`
- `/recurring-incomes`
- `/saving-goals`
- `/groups`

## Layer UI

### Layout condivisi

- `app/layout.tsx`: font globali e metadata.
- `app/(dashboard)/layout.tsx`: protezione auth e montaggio `AppShell`.
- `components/layout/app-shell.tsx`: header, sidebar desktop e bottom nav mobile.

### Workspace client

Ogni dominio principale ha un workspace client che gestisce:

- stato locale;
- fetch verso API interne;
- messaggi di errore/successo;
- modali di creazione;
- in alcuni casi ottimismo locale.

I workspace sono:

- `TransactionsWorkspace`
- `SavingGoalsWorkspace`
- `RecurringIncomesWorkspace`
- `GroupsWorkspace`

## Layer servizi

I service sono la vera sede della logica di business.

### Caratteristiche comuni

- usano `createSupabaseServerClient()`;
- mappano le righe del DB in tipi frontend;
- incapsulano query, ordinamenti e trasformazioni;
- centralizzano logiche non banali come materializzazione ricorrenze o settlement.

### Servizi presenti

- `services/auth/*`
- `services/dashboard/dashboard-service.ts`
- `services/transactions/transactions-service.ts`
- `services/recurring-incomes/recurring-income-service.ts`
- `services/saving-goals/saving-goals-service.ts`
- `services/group-expenses/group-expenses-service.ts`

## API interne

Le route in `app/api` espongono un layer REST JSON interno.

### Pattern comune

- verifica sessione con `getUser()`;
- parsing body JSON;
- validazione Zod;
- chiamata al service di dominio;
- risposta JSON con payload o messaggio errore.

### Motivazione architetturale

Questo doppio layer `page server-side + workspace client + API` rende l'app:

- veloce al first paint grazie al rendering server-side;
- interattiva nelle mutazioni client;
- semplice da estendere con consumer esterni o agenti AI che operano via HTTP interno.

## Supabase integration

### Client server-side

- `lib/supabase/server.ts` crea il client SSR usando cookies Next.
- I tentativi di scrittura cookie nei Server Components vengono tollerati e delegati al middleware.

### Client browser

- `lib/supabase/client.ts` espone un browser client typed.
- Al momento la maggior parte della logica dati passa dal server, non direttamente dal client Supabase.

### Middleware sessione

- `lib/supabase/middleware.ts` aggiorna la sessione.
- Reindirizza anonimi da `/dashboard...` a `/login`.
- Reindirizza utenti autenticati da `/login` a `/dashboard`.

## Validazione input

Tutte le mutazioni importanti usano Zod in `lib/validations`.

### Benefici

- errori utente coerenti;
- contratti espliciti per ogni form;
- minore dispersione di validazione nei componenti.

### Nota pratica

Le validazioni attuali riflettono la UI corrente, non tutto il potenziale dello schema SQL. Esempio:

- transazioni: niente `transfer`;
- recurring incomes: niente `daily` o `quarterly`;
- group expenses: solo `equal` e `custom`.

## Calcoli di dominio

I moduli in `lib/` contengono logica pura riutilizzabile e testabile.

### Moduli rilevanti

- `lib/budget/daily-budget.ts`: formula del budget giornaliero.
- `lib/saving-goals/calculations.ts`: metriche di raggiungibilita dei goal.
- `lib/group-expenses/calculations.ts`: split, parsing custom values e saldo di gruppo.

## Pattern di stato lato client

I workspace client usano uno stile pragmatico:

- `useState` per stato locale;
- `fetch` diretto verso API interne;
- `startTransition` in alcuni casi per refresh non bloccanti;
- ottimismo locale selettivo nelle transazioni e nei toggle.

Non c'e una state library globale dedicata. Questo mantiene il progetto semplice, ma puo diventare un punto di refactoring se la complessita UI cresce.

## Convenzioni osservate

- UI e messaggi principalmente in italiano.
- Nomi file e alcune label in inglese.
- Valuta applicativa corrente fissata a `EUR`.
- Ordinamenti e formattazione localizzati su `it-IT`.
- Le query sono generalmente user-scoped grazie a RLS e relazioni con `user_id`.
