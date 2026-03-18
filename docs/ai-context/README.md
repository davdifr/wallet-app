# AI Context Pack

Questa cartella raccoglie documentazione pensata per onboarding rapido di nuove AI o sviluppatori che devono continuare ad evolvere `wallet-app`.

## File disponibili

- `project-overview.md`: panoramica del prodotto, stack, moduli e flussi principali.
- `feature-map.md`: elenco dettagliato delle funzionalita utente gia implementate e del loro comportamento.
- `architecture.md`: struttura applicativa, layer tecnici, pattern usati e flussi tra UI, API e servizi.
- `database-and-supabase.md`: schema dati, tabelle, relazioni, RLS e note operative su Supabase.
- `ai-handoff.md`: stato del progetto, vincoli, gap, opportunita di miglioramento e punti da controllare prima di modificare il codice.

## Come usare questa documentazione come contesto AI

Se devi passare contesto a un'altra AI, l'ordine consigliato e:

1. `project-overview.md`
2. `feature-map.md`
3. `architecture.md`
4. `database-and-supabase.md`
5. `ai-handoff.md`

## Snapshot sintetica

- App web personale per gestione finanze con autenticazione Google via Supabase.
- Frontend in Next.js App Router con React 19, TypeScript e Tailwind.
- Backend applicativo principalmente server-side via Supabase SSR, Server Components, Server Actions e Route Handlers REST.
- Domini principali: dashboard, transazioni, entrate ricorrenti, saving goals e spese di gruppo.
- Database Postgres/Supabase gia modellato per funzionalita piu ampie di quelle attualmente esposte in UI.
