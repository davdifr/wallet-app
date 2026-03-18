# Database And Supabase

## Visione d'insieme

Il database pubblico Supabase modella sia finanza personale sia collaborazione di gruppo. Le tabelle principali sono:

- `users`
- `transactions`
- `recurring_incomes`
- `monthly_budget_settings`
- `saving_goals`
- `goal_contributions`
- `groups`
- `group_members`
- `shared_expenses`
- `shared_expense_splits`
- `settlements`

## Enums principali

- `transaction_type`: `income`, `expense`, `transfer`
- `transaction_status`: `pending`, `cleared`, `cancelled`
- `recurrence_frequency`: `daily`, `weekly`, `monthly`, `quarterly`, `yearly`
- `goal_status`: `active`, `completed`, `cancelled`, `paused`
- `goal_priority`: `low`, `medium`, `high`
- `group_role`: `owner`, `admin`, `member`
- `split_method`: `equal`, `custom`, `percentage`, `shares`
- `shared_expense_status`: `draft`, `posted`, `settled`, `cancelled`
- `settlement_status`: `pending`, `completed`, `cancelled`

## Tabelle di profilo e ownership

### `users`

Scopo:

- profilo applicativo sincronizzato con `auth.users`.

Campi chiave:

- `id` FK verso `auth.users.id`
- `email`
- `full_name`
- `avatar_url`
- `default_currency`
- `timezone`

Note:

- viene upsertata automaticamente da `ensureUserProfile`.
- molti record applicativi referenziano `public.users`, quindi questa tabella e parte strutturale dell'app.

## Finanza personale

### `transactions`

Scopo:

- ledger principale di movimenti manuali e generati automaticamente.

Campi chiave:

- `user_id`
- `group_id`
- `transaction_type`
- `status`
- `amount`
- `currency`
- `transaction_date`
- `description`
- `category`
- `merchant`
- `notes`
- `is_shared`
- `settlement_id`
- `shared_expense_id`
- `recurring_income_id`
- `recurring_income_instance_key`
- `recurring_occurrence_date`

Osservazioni:

- e usata sia per movimenti personali sia per effetti contabili di gruppo.
- una transazione puo derivare da recurring income, shared expense o settlement.
- `recurring_income_instance_key` impedisce duplicati durante la materializzazione.

### `recurring_incomes`

Scopo:

- definizione di entrate periodiche.

Campi chiave:

- `user_id`
- `amount`
- `currency`
- `description`
- `category`
- `source`
- `frequency`
- `starts_on`
- `ends_on`
- `next_occurrence_on`
- `is_active`

Osservazioni:

- la UI usa solo frequenze settimanali, mensili e annuali.
- `next_occurrence_on` e il cursore operativo per la sincronizzazione.

### `monthly_budget_settings`

Scopo:

- configurazione budget per mese.

Campi chiave:

- `user_id`
- `budget_month`
- `total_budget`
- `target_savings`
- `category_limits`
- `rollover_enabled`
- `notes`

Osservazioni:

- la dashboard oggi legge soprattutto `target_savings`.
- non esiste ancora una UI completa per creare o modificare queste impostazioni.

## Saving goals

### `saving_goals`

Scopo:

- obiettivi di risparmio utente.

Campi chiave:

- `user_id`
- `title`
- `description`
- `target_amount`
- `saved_so_far`
- `currency`
- `target_date`
- `status`
- `priority`

Evoluzione schema:

- la migrazione `saving-goals.sql` rinomina `name` in `title`.
- la stessa migrazione rinomina `current_amount` in `saved_so_far`.

### `goal_contributions`

Scopo:

- storico contributi ai goal.

Campi chiave:

- `goal_id`
- `user_id`
- `transaction_id`
- `amount`
- `contribution_date`
- `note`

Osservazioni:

- attualmente `transaction_id` non viene valorizzato dal codice applicativo.
- il totale del goal viene mantenuto aggiornando `saving_goals.saved_so_far`.

## Gruppi e spese condivise

### `groups`

Scopo:

- contenitore di spese condivise.

Campi chiave:

- `owner_user_id`
- `name`
- `description`
- `currency`

Trigger rilevante:

- `handle_new_group()` inserisce automaticamente l'owner in `group_members` con ruolo `owner`.

### `group_members`

Scopo:

- partecipanti al gruppo, anche guest.

Campi chiave:

- `group_id`
- `user_id` nullable
- `display_name`
- `guest_email`
- `is_guest`
- `role`

Osservazioni:

- supporta sia utenti reali dell'app sia ospiti senza account.
- `group_id + user_id` e univoco.
- esiste anche un indice univoco per `guest_email` per gruppo.

### `shared_expenses`

Scopo:

- evento di spesa condivisa.

Campi chiave:

- `group_id`
- `created_by_user_id`
- `paid_by_user_id`
- `paid_by_member_id`
- `title`
- `description`
- `amount`
- `currency`
- `expense_date`
- `split_method`
- `status`
- `transaction_id`

Osservazioni:

- il service crea anche una transazione `expense` per il pagatore reale se esiste `paid_by_user_id`.

### `shared_expense_splits`

Scopo:

- dettaglio quote individuali per ciascuna shared expense.

Campi chiave:

- `shared_expense_id`
- `user_id`
- `group_member_id`
- `amount`
- `percentage`
- `shares`
- `is_paid`
- `settled_amount`
- `settled_at`

Osservazioni:

- lo schema supporta `percentage` e `shares`, ma la UI oggi usa solo importi espliciti o split equal.
- `settled_amount` permette settlement parziali.

### `settlements`

Scopo:

- rimborsi tra membri relativi a quote o spese di gruppo.

Campi chiave:

- `group_id`
- `shared_expense_id`
- `shared_expense_split_id`
- `created_by_user_id`
- `accepted_by_user_id`
- `payer_user_id`
- `payee_user_id`
- `payer_member_id`
- `payee_member_id`
- `amount`
- `currency`
- `settlement_date`
- `status`
- `accepted_at`
- `note`

Osservazioni:

- possono essere `pending` o `completed`.
- il completamento aggiorna la quota collegata e genera transazioni collegate.

## Trigger e funzioni SQL

### `set_updated_at()`

- funzione trigger generica per mantenere `updated_at`.

### `handle_new_group()`

- crea automaticamente il membro owner quando nasce un gruppo.

### `is_group_member(check_group_id uuid)`

- helper SQL usato dalle policy per capire se `auth.uid()` appartiene al gruppo.

### `is_group_admin(check_group_id uuid)`

- helper SQL per owner/admin.

## Policy RLS osservate

Nel materiale letto sono visibili soprattutto policy aggiunte o modificate per le spese di gruppo.

### Shared expenses insert

- consente insert solo ai membri del gruppo;
- richiede che `created_by_user_id = auth.uid()`;
- verifica che `paid_by_member_id` appartenga al gruppo.

### Settlements insert

- consente insert ai membri del gruppo;
- richiede creator coerente con `auth.uid()`;
- verifica che payer e payee member siano membri del gruppo.

### Settlements update

- permesso a payer, payee, creator o group admin.

## Indici rilevanti

Alcuni indici particolarmente importanti per performance:

- transazioni per utente e data;
- transazioni per tipo e data;
- ricorrenze per utente, stato e prossima occorrenza;
- saving goals per utente, stato e data target;
- contributions per goal e data;
- group members per user/gruppo;
- shared expenses per gruppo e data;
- settlements per gruppo, stato e data;
- indice univoco occorrenze ricorrenti su `transactions.recurring_income_instance_key`.

## Disallineamenti da tenere a mente

- Il DB supporta piu casi d'uso di quelli esposti oggi dalla UI.
- `types/database.ts` riflette lo stato attuale atteso dal codice applicativo e va tenuto coerente con SQL.
- Le migrazioni SQL sono manuali, non appare un sistema automatizzato con timestamp migration files.
