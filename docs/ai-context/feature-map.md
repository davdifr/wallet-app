# Feature Map

## 1. Login e sessione

### Cosa fa

- Login con Google OAuth tramite Supabase.
- Redirect automatico da `/` verso area autenticata o login.
- Protezione server-side nel layout dashboard.
- Refresh sessione in middleware.
- Creazione o aggiornamento automatico del profilo utente nella tabella `users`.

### Come funziona

- L'azione `signInWithGoogle` usa `supabase.auth.signInWithOAuth`.
- Il redirect OAuth punta a `/auth/callback`.
- `getUser()` interroga Supabase SSR e chiama `ensureUserProfile(user)`.
- `ensureUserProfile` salva email, nome, avatar, valuta di default e timezone.

### Note importanti

- `middleware.ts` considera protetta solo la route che inizia con `/dashboard`, ma il layout `app/(dashboard)/layout.tsx` protegge di fatto tutte le pagine del gruppo dashboard.
- La tabella `users` e fondamentale per quasi tutti i record applicativi, perche le entita sono legate a `public.users`, non direttamente ad `auth.users`.

## 2. Dashboard

### Cosa mostra

- daily budget centrato su "Puoi spendere oggi";
- spendibile residuo del mese;
- quota bloccata nel salvadanaio;
- riserva prudenziale;
- quota teorica protetta per i goal;
- giorni residui;
- top categorie di spesa;
- stato sintetico dei saving goals;
- overview compatta del salvadanaio;
- attivita recente.

### Come calcola i dati

- Usa transazioni `income` e `expense` del mese corrente.
- Esclude `transfer`.
- Somma le entrate ricorrenti attive previste entro fine mese.
- Sottrae il saldo del salvadanaio dal denaro spendibile.
- Usa la media spese degli ultimi 3 mesi per la riserva prudenziale.
- Protegge una quota teorica dei goal attivi in base alla priorita.
- Prende fino a 4 categorie top per spesa.
- Prende fino a 3 saving goals attivi o completati.
- Prende fino a 6 movimenti recenti.

### Dettagli logici utili

- Il grafico trend considera solo spese degli ultimi 7 giorni.
- Il widget daily budget usa patrimonio liquido del mese, ricorrenze future, salvadanaio, riserva prudenziale e protezione goal.
- La card saving goals usa `calculateSavingGoalMetrics` per progress, reachability e importo residuo.
- La dashboard non mostra piu il vecchio hero overview ridondante.
- Il salvadanaio in dashboard e compatto e apre una sola modale di gestione con tab `Aggiungi`, `Svincola`, `Piano mensile`.
- La dashboard ha una route API dedicata `/api/dashboard` e usa query cache per migliorare la navigazione tra tab.

## 3. Transazioni

### Funzionalita disponibili

- Creazione transazione manuale.
- Modifica transazione esistente.
- Eliminazione transazione.
- Filtri per mese, categoria e tipo.
- Supporto a entrate e uscite.
- Aggiornamento client con query cache, invalidazione dashboard e refetch coerente dei filtri.

### Dati gestiti

- importo;
- data;
- categoria;
- nota;
- fonte/merchant;
- tipo (`income` o `expense`).

### Comportamento

- Le transazioni sono ordinate per `transaction_date desc`, poi `created_at desc`.
- La descrizione salvata in DB viene costruita automaticamente nel formato:
  `Income/Expense · categoria · source`.
- La valuta e fissata a `EUR`.
- Le categorie disponibili nei filtri vengono ricavate dalle transazioni esistenti.
- I mesi disponibili nei filtri vengono derivati dallo storico transazioni.

### Vincoli attuali

- La UI e la validazione gestiscono solo `income` e `expense`, anche se il DB supporta `transfer`.
- Non esiste ancora gestione dedicata per allegati, tagging avanzato o riconciliazione bancaria.

## 4. Entrate ricorrenti

### Funzionalita disponibili

- Creazione ricorrenza.
- Attivazione/disattivazione.
- Eliminazione della definizione di ricorrenza senza cancellare retroattivamente le transazioni gia materializzate.
- Materializzazione on-demand delle occorrenze mancanti in transazioni reali durante letture strategiche.
- Prevenzione duplicati tramite chiave univoca per occorrenza.

### Frequenze supportate oggi dalla UI

- `weekly`
- `monthly`
- `yearly`

### Frequenze previste dal database ma non esposte in UI

- `daily`
- `quarterly`

### Come funziona la materializzazione

1. Cerca ricorrenze attive con `next_occurrence_on <= oggi`.
2. Per ogni ricorrenza, genera tutte le occorrenze fino a oggi.
3. Inserisce in `transactions` una riga `income` per ogni occorrenza.
4. Salva metadati di relazione:
   `recurring_income_id`, `recurring_occurrence_date`, `recurring_income_instance_key`.
5. Se l'occorrenza esiste gia, il vincolo univoco produce errore `23505` e l'app la conta come duplicato ignorato.
6. Aggiorna `next_occurrence_on` alla prossima data utile.
7. Se la ricorrenza ha superato `ends_on`, puo essere automaticamente disattivata.

### Note utili

- Non esiste piu un pulsante manuale di sync in UI.
- Non esiste ancora un job schedulato interno al repository: la sincronizzazione resta on-demand lato server.
- Le transazioni create hanno note automatiche che indicano l'origine ricorrente.

## 5. Saving Goals

### Funzionalita disponibili

- Creazione di un goal con titolo, target, priorita e descrizione opzionale.
- Elenco goal con card dettagliate.
- Aggiunta di contributi manuali.
- Eliminazione goal.
- Aggiornamento automatico di `saved_so_far`.
- Passaggio automatico a `completed` quando il target viene raggiunto o superato.

### Metriche calcolate

- percentuale di progresso;
- importo residuo;
- totale contributi manuali storici;
- quota teorica mensile allocabile;
- mesi residui;
- contributo mensile necessario;
- media mensile risparmiata;
- raggiungibilita rispetto al ritmo attuale;
- health status (`in_linea`, `lento`, `bloccato`, `completato`).

### Comportamento

- Ogni contributo viene salvato in `goal_contributions`.
- Dopo il contributo, il service ricalcola `saved_so_far` sul goal.
- I goal sono ordinati per priorita e vicinanza stimata al completamento.
- La dashboard riutilizza gli stessi dati per mostrare un riepilogo sintetico.

### Vincoli attuali

- Il form non richiede piu `targetDate`; se presente viene trattata come data desiderata.
- Non esistono ancora edit, pause o cancel da UI, anche se il DB supporta piu stati.
- I contributi non generano automaticamente una transazione collegata, anche se lo schema `goal_contributions` prevede `transaction_id`.

## 6. Salvadanaio

### Funzionalita disponibili

- Saldo vincolato separato dai goal.
- Movimenti manuali di aggiunta e svincolo.
- Piano mensile automatico di allocazione.
- Materializzazione automatica delle allocazioni mensili nel ledger dedicato.
- Storico recente dei movimenti in dashboard.

### Modello concettuale

- Il salvadanaio fa parte del patrimonio totale.
- Il saldo del salvadanaio non fa parte del denaro spendibile.
- I goal non ricevono soldi automatici reali dal salvadanaio.
- La dashboard usa il saldo salvadanaio come vincolo di liquidita.

### UX attuale

- In dashboard il salvadanaio e rappresentato da una card compatta.
- Le azioni `Aggiungi`, `Svincola` e `Piano mensile` sono gestite da una sola modale a tab.
- Il piano mensile non e piu mostrato come form lungo inline nella dashboard.

## 7. Spese di gruppo

### Funzionalita disponibili

- Creazione gruppo.
- Inserimento automatico del proprietario come membro owner tramite trigger DB.
- Aggiunta membri come utenti registrati o guest.
- Ricerca utenti registrati con suggerimenti e directory sicura.
- Creazione spesa condivisa.
- Split `equal` o `custom`.
- Calcolo saldi netti di gruppo.
- Registrazione rimborsi su singola quota.
- Workflow di accettazione settlement quando necessario.
- Indicatore unread per nuove spese condivise non ancora viste dall'utente corrente.
- Badge unread anche nella navbar mobile e desktop quando almeno un gruppo ha nuove spese.
- Aggiornamento realtime del dominio gruppi per `shared_expenses` e `settlements`.
- Rimozione partecipanti da parte dell'owner con controlli di sicurezza.
- Eliminazione del gruppo anche in presenza di storico, con cleanup ordinato delle dipendenze lato service.
- Sincronizzazione delle spese e dei rimborsi nel ledger `transactions`.

### Modello concettuale

- `groups`: contenitore logico.
- `group_members`: partecipanti, anche guest.
- `shared_expenses`: spesa condivisa principale.
- `shared_expense_splits`: quote individuali della spesa.
- `settlements`: rimborsi tra membri.

### Guest vs utenti registrati

- Un membro guest puo esistere senza `user_id`.
- Una spesa puo essere pagata anche da un guest tramite `paid_by_member_id`.
- I settlement che coinvolgono guest vengono completati subito, senza attesa di accettazione da parte di un account applicativo.
- I profili applicativi dei membri registrati vengono arricchiti con nome, email e avatar dalla directory utenti.

### Split disponibili oggi

- `equal`: ripartizione equa con arrotondamento e resto assegnato all'ultimo membro.
- `custom`: quote esplicite passate dal client.

### Split previsti dal database ma non ancora usati nella UI

- `percentage`
- `shares`

### Workflow settlement

1. Si seleziona una quota ancora non completamente saldata.
2. Il service controlla importo residuo considerando anche settlement pendenti.
3. Crea un record `settlements`.
4. Se chi registra il rimborso e gia una delle parti coinvolte, oppure una parte e guest, il settlement viene chiuso subito.
5. Altrimenti resta `pending`.
6. Quando il settlement viene accettato, il service aggiorna `shared_expense_splits.settled_amount` e `is_paid`.
7. In caso di settlement completato vengono generate transazioni speculari:
   una spesa per il payer e una entrata per il payee, entrambe marcate come `is_shared`.

### Stato di visualizzazione e unread

- Ogni gruppo espone `hasUnreadExpenses` nella lista.
- Il flag e derivato confrontando l'ultima `shared_expense.created_at` rilevante con lo stato di visualizzazione per coppia `user + group`.
- Se l'utente apre `/groups/[groupId]`, il gruppo viene marcato come visto.
- Se l'utente crea lui stesso una nuova shared expense, il gruppo resta visto per lui.
- Il pallino rosso sulla card gruppo e sulla navbar e solo un indicatore visuale, non esiste un centro notifiche completo.

### UX attuale della sezione spese

- La lista `Spese condivise` non mostra piu tutte le quote e i form inline per ogni item.
- Ogni spesa appare come card compatta con titolo, importo, data, pagatore e stato sintetico.
- Sono presenti filtri locali: `Tutte`, `Quote aperte`, `Rimborsi in attesa`.
- E presente un ordinamento locale: `Piu recenti`, `Importo piu alto`, `Importo piu basso`.
- Il dettaglio completo della spesa si apre in modale e contiene quote, rimborsi pendenti e form di settlement.
- I badge di stato della lista distinguono chiaramente tra:
  - `Tutto regolato`
  - `Rimborsi in attesa`
  - `Quote da regolare`

### Calcolo dei saldi di gruppo

- Chi paga una spesa riceve credito pari all'intero importo.
- Ogni quota riduce il saldo del membro assegnato.
- I settlement completati riducono il debito del payer e il credito del payee.
- Il sistema produce anche una lista di debiti suggeriti `from -> to`.

### Limiti e note

- Non ci sono ancora edit/delete per shared expenses o settlement.
- La UI non espone ruoli avanzati oltre all'owner creato automaticamente.
- Non esiste ancora invito via email reale: l'aggiunta di utenti registrati avviene cercandoli nella directory utenti applicativa.

### Routing gruppi

- `/groups` mostra solo l'elenco gruppi.
- `/groups` e anche il punto in cui compare il pallino rosso sulle card con nuove spese non viste.
- `/groups/[groupId]` contiene dettagli, membri, spese, saldi e azioni del singolo gruppo.

## 8. API interne

### Stato attuale

Esiste un set completo di route REST JSON parallelo alle Server Actions. Le API coprono:

- dashboard;
- piggy bank;
- transazioni;
- recurring incomes;
- saving goals;
- gruppi, membri, spese, settlement.

### Perche e importante

- I workspace client usano principalmente le API per aggiornamenti dinamici.
- Le Server Actions restano presenti e utili per form server-driven, ma l'esperienza attuale usa spesso `fetch`.
- Questo rende il progetto gia predisposto a future integrazioni mobile, agentiche o terze parti.

## 9. Testing

### Copertura presente

- Test unitari di `calculateDailyBudget`.
- Test su validazioni `piggy-bank`.
- Test su `calculatePiggyBankBalance`.
- Test su invalidazioni query per dominio.
- Test sui calcoli e su alcuni flow service dei saving goals.

### Cosa manca

- test dei service layer;
- test di materializzazione ricorrenze;
- test di calcolo split/settlement;
- test di route handlers;
- test end-to-end delle sezioni principali.
