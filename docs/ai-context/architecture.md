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
3. il workspace usa TanStack Query per cache, refetch e invalidazione;
4. il workspace usa modali e form per le mutazioni;
5. le mutazioni vanno a `/api/...` o Server Actions residue;
6. i service incapsulano la logica verso Supabase.

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
- `/groups/[groupId]`

## Layer UI

### Layout condivisi

- `app/layout.tsx`: font globali, metadata PWA, viewport e integrazione Apple Web App.
- `app/manifest.ts`, `app/icon.tsx`, `app/apple-icon.tsx`: manifest e asset PWA generati lato Next.
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

- `DashboardWorkspace`
- `TransactionsWorkspace`
- `SavingGoalsWorkspace`
- `RecurringIncomesWorkspace`
- `GroupsWorkspace`
- `GroupDetailWorkspace`

### Linee guida UI attuali

- la dashboard deve restare focalizzata su `quanto puoi spendere oggi`;
- i form lunghi o multi-step non dovrebbero vivere inline nella dashboard;
- per azioni puntuali si preferiscono modali coerenti con il resto dell'app;
- la shell deve restare sicura in PWA iPhone standalone, senza rompere safe area, header e bottom nav.

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
- `services/budget/budget-service.ts`
- `services/piggy-bank/piggy-bank-service.ts`
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
- piu consistente tra pagine e tab grazie a query cache condivisa;
- semplice da estendere con consumer esterni o agenti AI che operano via HTTP interno.

### API di dominio oggi presenti

Oltre ai domini storici, l'app espone anche:

- `app/api/piggy-bank/*` per overview, movimenti manuali e piano mensile;
- `app/api/dashboard` con il payload aggregato della home;
- `app/api/saving-goals/[id]/contributions` per contributi manuali espliciti.

## Stato client e caching

L'app non usa uno store globale custom per i dati server. Usa invece un approccio server-state:

- `DashboardQueryProvider` nel layout dashboard;
- TanStack Query per cache per dominio;
- chiavi centralizzate in `lib/query/query-keys.ts`;
- invalidazione coordinata dopo mutazioni;
- helper condiviso per invalidare i domini dipendenti dalle mutazioni piu comuni;
- sync cross-tab via `BroadcastChannel` con fallback `storage`;
- prefetch di route e dati nelle tab principali.
- per `groups`, bridge realtime client con Supabase Realtime per aggiornare unread, lista e dettagli senza refresh manuali.

Questo e oggi il pattern preferito per nuove feature interattive.

## Supabase integration

### Client server-side

- `lib/supabase/server.ts` crea il client SSR usando cookies Next.
- I tentativi di scrittura cookie nei Server Components vengono tollerati e delegati al middleware.

### Client browser

- `lib/supabase/client.ts` espone un browser client typed.
- Al momento la maggior parte della logica dati passa dal server, non direttamente dal client Supabase.
- Eccezione importante: il dominio `groups` usa il client browser anche per subscription realtime su `shared_expenses` e `settlements`.

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

Sono presenti anche validazioni dedicate per:

- salvadanaio (`movimenti` e `piano mensile`);
- goal con `targetDate` opzionale lato UI;
- vincoli di date mensili come il primo giorno del mese per l'attivazione dei piani automatici.
- categorie transazioni e recurring incomes coerenti con il catalogo condiviso e con il tipo (`expense` o `income`).

## Calcoli di dominio

I moduli in `lib/` contengono logica pura riutilizzabile e testabile.

### Moduli rilevanti

- `lib/budget/daily-budget.ts`: formula del budget giornaliero centrata su spendibile, salvadanaio, riserva prudenziale e protezione goal.
- `lib/budget/goal-protection.ts`: distribuzione teorica della capacita verso i goal in base alla priorita.
- `lib/budget/spending-pace.ts`: ritmo medio di spesa sugli ultimi 3 mesi chiusi.
- `lib/piggy-bank/balance.ts`: saldo affidabile del salvadanaio a partire dai movimenti ledger.
- `lib/saving-goals/calculations.ts`: metriche di progresso reale dei goal.
- `lib/saving-goals/forecast.ts`: stima di mesi e data di completamento dei goal.
- `lib/saving-goals/sorting.ts`: ordinamento per priorita e vicinanza stimata al completamento.
- `lib/group-expenses/calculations.ts`: split, parsing custom values e saldo di gruppo.
- `lib/group-expenses/unread-expenses.ts`: calcolo puro del flag unread per gruppo.
- `lib/group-expenses/realtime.ts`: helper puri per decidere come reagire agli eventi realtime del dominio gruppi.
- `lib/categories/catalog.ts`: catalogo condiviso categorie con slug stabile, label italiana, icona, alias legacy e helper di compatibilita.

## Dominio categorie

Il progetto usa ora un catalogo categorie condiviso tra transazioni, recurring incomes e dashboard.

### Principi

- slug tecnico stabile;
- label UI in italiano;
- icona predefinita dal catalogo;
- scope per `expense` e `income`;
- fallback `Altro` separato per spesa ed entrata.

### Compatibilita storica

- i nuovi record salvano sia `category_slug` sia `category`;
- il codice legge prima `category_slug` se presente;
- se manca, prova a risolvere `category` tramite alias legacy;
- se il valore non e riconosciuto, mantiene il testo storico leggibile e usa fallback sicuro.

### Implicazioni pratiche

- i service fanno dual-read/dual-write;
- i filtri categoria sulle transazioni lavorano su slug normalizzati quando possibile;
- la dashboard aggrega le top categorie sulle categorie canoniche per ridurre frammentazione;
- le ricorrenze materializzate generano transazioni con categorie canoniche coerenti.

## Pattern di stato lato client

I workspace client usano uno stile pragmatico:

- `useState` per stato locale;
- TanStack Query per fetch, cache e refetch;
- `fetch` verso API interne tramite helper condiviso;
- invalidazione per dominio e update locale selettivo dopo mutazioni;
- ottimismo locale leggero dove utile.

Nel dominio `groups` il pattern attuale e:

- page server per bootstrap dati;
- workspace client con query TanStack;
- mutazioni via API interne;
- invalidazione dominio `groups` e sync cross-tab;
- subscription realtime globale nella shell per eventi collaborativi.

Non c'e una state library globale classica per tutti gli stati. La parte condivisa riguarda soprattutto il server state.

## Convenzioni osservate

- UI e messaggi principalmente in italiano.
- Nomi file e alcune label in inglese.
- Valuta applicativa corrente fissata a `EUR`.
- Ordinamenti e formattazione localizzati su `it-IT`.
- Le query sono generalmente user-scoped grazie a RLS e relazioni con `user_id`.
- In modalita iPhone standalone la shell mobile usa le `safe-area-inset-*` per evitare sovrapposizioni con notch, Dynamic Island e bordi arrotondati.
