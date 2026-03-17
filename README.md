# Wallet App

Wallet App e una web app full-stack starter costruita con Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui e Supabase.

## Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui base components
- Supabase SSR auth
- OAuth Google

## Struttura cartelle

```text
.
|-- app
|   |-- (auth)
|   |   `-- login
|   |-- (dashboard)
|   |   `-- dashboard
|   `-- auth/callback
|-- components
|   |-- layout
|   `-- ui
|-- hooks
|-- lib
|   `-- supabase
|-- services
|   `-- auth
`-- types
```

## Pagine incluse

- `/login`: pagina login con CTA Google OAuth
- `/dashboard`: dashboard placeholder protetta
- `/auth/callback`: route handler per completare il login Supabase

## Setup

1. Installa le dipendenze:

```bash
npm install
```

2. Crea il file `.env.local` partendo da `.env.example` e imposta:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. In Supabase abilita Google OAuth:

- Vai su `Authentication > Providers > Google`
- Inserisci `Client ID` e `Client Secret`
- Aggiungi come redirect URL:

```text
http://localhost:3000/auth/callback
```

4. Avvia il progetto:

```bash
npm run dev
```

## Note architetturali

- `lib/supabase`: client browser, server e middleware
- `services/auth`: helpers server-side per sessione e utente
- `hooks`: hook client riutilizzabili
- `components/ui`: primitive UI in stile shadcn/ui
- `components/layout`: shell condivisa tra auth e dashboard

## Route protette

Le route protette sono gestite in due punti:

- `middleware.ts` aggiorna la sessione e blocca accessi anonimi a `/dashboard`
- `app/(dashboard)/layout.tsx` effettua un controllo server-side aggiuntivo

## Comandi utili

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```
