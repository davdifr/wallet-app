# AI Handoff

## Cosa sapere prima di modificare il progetto

- Il progetto e gia funzionante su piu domini, quindi conviene evitare refactor trasversali senza un obiettivo chiaro.
- Il service layer e il punto giusto in cui inserire logica di business aggiuntiva.
- I workspace client dipendono dalle API `/api/...`; cambiare i payload richiede aggiornamenti coordinati.
- Il pattern corrente per i dati client e `server page -> workspace client -> API interne -> TanStack Query`.
- La UI e in italiano, quindi nuove schermate o messaggi dovrebbero mantenere la stessa lingua salvo decisione esplicita.
- La valuta e quasi ovunque hardcoded a `EUR`.
- L'app ha una configurazione PWA iOS minima gia attiva; modifiche a header o bottom nav mobile vanno testate anche in homescreen standalone su iPhone.

## Stato reale delle funzionalita

### Solido oggi

- autenticazione e protezione sessione;
- CRUD transazioni;
- ricorrenze con deduplica;
- saving goals con metriche, forecast e priorita;
- salvadanaio con ledger dedicato, movimenti manuali e piano mensile automatico;
- gruppi con guest, split, settlement, delete e sync su transazioni;
- dashboard aggregata con cache query dedicata e daily budget centrato su "quanto puoi spendere oggi".

### Parzialmente sviluppato

- budget mensile legacy: schema esiste ma non e piu il fulcro del daily budget;
- stati avanzati dei goal: il DB li supporta, la UI quasi no;
- split method avanzati: previsti a schema, non ancora implementati lato prodotto;
- tipo `transfer` per transazioni: supportato a DB ma non a livello UI/validation;
- frequenze `daily` e `quarterly` per recurring incomes: presenti nel DB, non nella UI.

## Punti sensibili

### 1. Ricorrenze e duplicati

La sicurezza contro duplicati dipende da `recurring_income_instance_key`. Se si tocca la logica di materializzazione, bisogna preservare questo comportamento.

Nota aggiornata:

- le ricorrenze materializzate salvano anche `category_slug` e devono restare coerenti con il catalogo income condiviso.

### 2. Settlement parziali

Le quote di gruppo usano `settled_amount`, non solo un booleano. Qualsiasi modifica ai rimborsi deve mantenere la compatibilita con saldi parziali e settlement pendenti.

### 3. Profilo utente

`getUser()` ha un side effect importante: esegue `ensureUserProfile`. Se si cambia quel flusso, si rischia di rompere la coerenza tra Supabase Auth e tabella `users`.

### 4. Dualismo server actions / API routes

Molte mutazioni esistono in entrambi i formati. Prima di rimuovere uno dei due layer bisogna verificare chi e davvero usato dalla UI attuale.

### 5. Query cache condivisa

Le viste principali usano TanStack Query con invalidazione per dominio e sync cross-tab. Se si introduce una nuova mutazione che impatta dashboard, transazioni, goal o gruppi, va quasi sempre aggiornata anche la strategia di invalidazione.

Nota aggiornata:

- per i domini principali l'invalidazione locale e cross-tab passa da una mappa condivisa di query key, non da logiche duplicate sparse nei workspace.
- per `groups` il comportamento live non dipende solo dall'invalidation: esiste anche un provider realtime globale nella shell che ascolta `shared_expenses` e `settlements`.

### 6. Directory utenti per gruppi

La ricerca e l'arricchimento dei profili gruppo non leggono piu direttamente `public.users`. Dipendono da funzioni SQL in `supabase/user-directory.sql`. Se manca l'applicazione di quel file sul database, invite e nomi profilo si rompono.

### 7. Safe area mobile

Header e bottom navigation mobile usano classi CSS basate su `env(safe-area-inset-*)`. Se si tocca la shell o il spacing globale, controllare sempre la resa su iPhone in modalita PWA, non solo in Safari normale.

### 8. Dashboard snella

La dashboard non deve diventare una pagina di configurazione. I form lunghi o multi-step, soprattutto per il salvadanaio, dovrebbero stare in modali o viste dedicate.

### 8-bis. Categorie condivise

Il dominio categorie ora ha alcune regole importanti:

- il catalogo condiviso vive in `lib/categories/catalog.ts`;
- `transactions` e `recurring_incomes` salvano `category_slug` oltre alla label;
- il codice deve preferire `category_slug` quando esiste;
- lo storico senza slug va letto con compatibilita legacy, non rotto o riscritto in modo aggressivo;
- la dashboard non deve frammentare le top categorie per alias storici simili.

### 9. Dominio gruppi live

Il dominio `groups` e ormai collaborativo in senso forte:

- unread per gruppo e per utente;
- badge navbar legato ai gruppi con nuove spese non viste;
- aggiornamento realtime di lista gruppi, dettaglio gruppo e settlement.

Se si tocca questa area, bisogna ragionare sempre insieme su:

- service layer;
- query cache `groups`;
- sync cross-tab;
- Supabase Realtime publication.

### 10. UX spese di gruppo

La sezione `Spese condivise` non e piu pensata come lista di card enormi con form inline ripetuti. Il pattern attuale e:

- lista compatta e scansionabile;
- filtri locali e ordinamento locale;
- dettaglio spesa in modale;
- form di rimborso dentro il dettaglio, non nella lista principale.

Se si reinterviene sulla UX, evitare di riportare quote e settlement inline su ogni card.

## Debito tecnico e opportunita ad alto valore

### Priorita alta

- consolidare ulteriormente la UX mobile della dashboard;
- aggiungere test di integrazione service/API per piggy bank;
- ampliare copertura test su servizi e calcoli di gruppo;
- introdurre edit dove mancano;
- centralizzare formattazione valuta/date e costanti condivise;
- verificare completezza delle policy RLS per tutte le tabelle, non solo quelle lette nelle migrazioni.
- aggiungere test piu diretti sul bridge realtime dei gruppi e su eventuali futuri eventi settlement live.
- applicare in ambiente reale `supabase/categories.sql` e verificare il backfill effettivo delle categorie storiche residue.

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
- verificare che la dashboard non reintroduca blocchi ridondanti o form lunghi inline.

### Se tocchi recurring incomes

- testare materializzazione multipla in arretrato;
- testare gestione `ends_on`;
- testare duplicati su stessa occorrenza.
- testare che la delete della ricorrenza non rimuova transazioni gia generate.
- testare coerenza tra `category_slug` della ricorrenza e della transazione materializzata.

### Se tocchi saving goals

- testare completamento automatico;
- testare progress e reachability con date limite passate e future.
- testare delete goal con contribution collegate.
- ricordare che `targetDate` e opzionale e non piu centrale lato prodotto.

### Se tocchi piggy bank

- testare saldo da movimenti manuali e auto monthly;
- testare svincolo oltre saldo disponibile;
- testare invalidazioni `piggy-bank`, `dashboard`, `saving-goals`;
- verificare coerenza UX tra card dashboard e modale di gestione.

### Se tocchi group expenses

- testare split equal con arrotondamenti;
- testare split custom non coerenti con totale;
- testare settlement pending vs completed;
- testare guest flow;
- testare aggiornamento `settled_amount`.
- testare rimozione membri solo quando consentita;
- testare delete gruppo con storico e cleanup transazioni correlate;
- testare directory utenti se l'ambiente richiede nuove funzioni SQL.
- testare unread/navbar se tocchi `shared_expenses`, `group_member_views` o subscription realtime.
- testare che i badge di stato delle spese restino semanticamente coerenti: `Tutto regolato`, `Rimborsi in attesa`, `Quote da regolare`.

### Se tocchi transazioni o categorie

- testare validazione categoria per tipo (`income` vs `expense`);
- testare edit record legacy non mappati;
- testare filtri categoria con mix canonico/legacy;
- testare dashboard top categorie con alias storici e con `category_slug` persistito.

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
