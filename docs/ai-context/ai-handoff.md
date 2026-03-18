# AI Handoff

## Cosa sapere prima di modificare il progetto

- Il progetto e gia funzionante su piu domini, quindi conviene evitare refactor trasversali senza un obiettivo chiaro.
- Il service layer e il punto giusto in cui inserire logica di business aggiuntiva.
- I workspace client dipendono dalle API `/api/...`; cambiare i payload richiede aggiornamenti coordinati.
- Il pattern corrente per i dati client e `server page -> workspace client -> API interne -> TanStack Query`.
- La UI e in italiano, quindi nuove schermate o messaggi dovrebbero mantenere la stessa lingua salvo decisione esplicita.
- La valuta e quasi ovunque hardcoded a `EUR`.

## Stato reale delle funzionalita

### Solido oggi

- autenticazione e protezione sessione;
- CRUD transazioni;
- ricorrenze con deduplica;
- saving goals con metriche;
- gruppi con guest, split, settlement, delete e sync su transazioni;
- dashboard aggregata con cache query dedicata.

### Parzialmente sviluppato

- budget mensile: schema esiste, dashboard lo legge, ma manca una vera UX di gestione;
- stati avanzati dei goal: il DB li supporta, la UI quasi no;
- split method avanzati: previsti a schema, non ancora implementati lato prodotto;
- tipo `transfer` per transazioni: supportato a DB ma non a livello UI/validation;
- frequenze `daily` e `quarterly` per recurring incomes: presenti nel DB, non nella UI.

## Punti sensibili

### 1. Ricorrenze e duplicati

La sicurezza contro duplicati dipende da `recurring_income_instance_key`. Se si tocca la logica di materializzazione, bisogna preservare questo comportamento.

### 2. Settlement parziali

Le quote di gruppo usano `settled_amount`, non solo un booleano. Qualsiasi modifica ai rimborsi deve mantenere la compatibilita con saldi parziali e settlement pendenti.

### 3. Profilo utente

`getUser()` ha un side effect importante: esegue `ensureUserProfile`. Se si cambia quel flusso, si rischia di rompere la coerenza tra Supabase Auth e tabella `users`.

### 4. Dualismo server actions / API routes

Molte mutazioni esistono in entrambi i formati. Prima di rimuovere uno dei due layer bisogna verificare chi e davvero usato dalla UI attuale.

### 5. Query cache condivisa

Le viste principali usano TanStack Query con invalidazione per dominio e sync cross-tab. Se si introduce una nuova mutazione che impatta dashboard, transazioni, goal o gruppi, va quasi sempre aggiornata anche la strategia di invalidazione.

### 6. Directory utenti per gruppi

La ricerca e l'arricchimento dei profili gruppo non leggono piu direttamente `public.users`. Dipendono da funzioni SQL in `supabase/user-directory.sql`. Se manca l'applicazione di quel file sul database, invite e nomi profilo si rompono.

## Debito tecnico e opportunita ad alto valore

### Priorita alta

- aggiungere gestione completa `monthly_budget_settings`;
- ampliare copertura test su servizi e calcoli di gruppo;
- introdurre edit dove mancano;
- centralizzare formattazione valuta/date e costanti condivise;
- verificare completezza delle policy RLS per tutte le tabelle, non solo quelle lette nelle migrazioni.

### Priorita media

- supporto UI a `transfer`;
- supporto UI a `daily` e `quarterly` per recurring incomes;
- supporto a split `percentage` e `shares`;
- collegare `goal_contributions` a vere transazioni opzionali;
- migliorare audit trail e notifiche per settlement pending.

### Priorita bassa o evolutiva

- jobs schedulati per materializzazione automatica ricorrenze;
- analytics piu profonde in dashboard;
- multi-currency reale;
- inviti di gruppo via email/link invece della sola ricerca su `users`.

## Testing consigliato quando si interviene

### Se tocchi dashboard o budget

- testare `calculateDailyBudget`;
- verificare dashboard con mese vuoto;
- verificare dashboard con entrate ricorrenti future nel mese.
- verificare invalidazione query `dashboard` dopo mutazioni in altri domini.

### Se tocchi recurring incomes

- testare materializzazione multipla in arretrato;
- testare gestione `ends_on`;
- testare duplicati su stessa occorrenza.
- testare che la delete della ricorrenza non rimuova transazioni gia generate.

### Se tocchi saving goals

- testare completamento automatico;
- testare progress e reachability con date limite passate e future.
- testare delete goal con contribution collegate.

### Se tocchi group expenses

- testare split equal con arrotondamenti;
- testare split custom non coerenti con totale;
- testare settlement pending vs completed;
- testare guest flow;
- testare aggiornamento `settled_amount`.
- testare rimozione membri solo quando consentita;
- testare delete gruppo con storico e cleanup transazioni correlate;
- testare directory utenti se l'ambiente richiede nuove funzioni SQL.

## Strategia consigliata per nuove AI

1. Leggere prima il service del dominio da modificare.
2. Leggere subito dopo il relativo file di validazione Zod.
3. Controllare le API route che consumano quel service.
4. Verificare il tipo in `types/*` e l'eventuale impatto su `types/database.ts`.
5. Controllare invalidazione query e sync cross-tab se la mutazione impatta altri domini.
6. Solo alla fine modificare UI e componenti.

## Checklist rapida prima di aprire una nuova feature

- Esiste gia supporto parziale nel DB o nei tipi?
- La UI attuale usa Server Actions o API route per quel dominio?
- La feature impatta query gia cacheate o prefetchate?
- Serve aggiornare query dashboard o relazioni tra tabelle?
- Serve un test unitario o di integrazione per la nuova logica?
- La feature e coerente con lingua italiana e formato `EUR` attuali?
