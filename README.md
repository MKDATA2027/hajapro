# HAJAPRO

Manage Smarter. Grow Faster.

HAJAPRO is a mobile-first business management platform by MK Company for tailoring shops, retailers, and their customers. The repository is at Milestone 1: secure account access and private workspace setup are implemented; operational modules are planned for later milestones.

## Stack

- Next.js App Router with strict TypeScript
- Tailwind CSS v4 and a small shared component/style system
- Supabase Auth, PostgreSQL, and Row Level Security
- Vitest for focused business-rule tests

## Supabase setup

Requirements: Node.js 20.9+, npm, and the [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started).

### Application environment

Create a Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard), then copy `.env.example` to `.env.local`. Set these values:

- `NEXT_PUBLIC_SUPABASE_URL`: Project URL from the dashboard's **Connect** dialog or **Project Settings → API**.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable key from **Project Settings → API Keys** (or the project's Connect dialog). Do not use a `service_role`/secret key.
- `NEXT_PUBLIC_APP_URL`: the origin where this Next.js app is running, with no path. Use `http://localhost:3000` locally and your canonical `https://` app origin in deployment.

The URL and publishable key must be non-placeholder values. `.env.local` is git-ignored. The app checks Supabase configuration before auth calls; sign-up and email callback additionally require a valid app origin. No credentials are required by the migration preflight beyond the Supabase CLI's own login.

### Hosted migration workflow

Never run a hosted migration push until the project ref and project name have been checked in the Supabase dashboard. The project ref appears in the project URL and in **Project Settings → General**. This repository workflow requires both an explicit ref and a typed confirmation before it invokes `db push`:

```sh
supabase login
supabase projects list
```

Compare the intended project's **name and ref** with the dashboard. Then link this repository to that exact ref and run the guarded push:

```sh
supabase link --project-ref <PROJECT_REF>
npm run supabase:push-hosted -- --project-ref <PROJECT_REF>
```

The guard verifies the 20-character ref against the repository's linked ref and the projects accessible to the CLI account, displays the project name/ref, and requires the operator to type the ref again. It then calls only `supabase db push --linked`, which applies pending migrations without resetting or deleting the hosted database. The CLI may prompt for the remote database password; enter it directly in the terminal. Do not bypass the guard for routine pushes, and never run `supabase db reset` against a hosted project.

### Email verification redirects

Sign-up sends users to `${NEXT_PUBLIC_APP_URL}/auth/callback`; the callback exchanges the code and redirects to `/setup` on the same configured origin. These values must match exactly:

- Local `.env.local`: `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
- Local Supabase CLI allowlist: `http://localhost:3000/auth/callback` (also includes `http://127.0.0.1:3000/auth/callback`).
- Hosted Supabase **Authentication → URL Configuration**: set **Site URL** to the deployed app origin, and add `<NEXT_PUBLIC_APP_URL>/auth/callback` as an allowed redirect URL. For example, if the app origin is `https://app.example.com`, allow `https://app.example.com/auth/callback`.

Keep email confirmation enabled in production. The project has not been connected or tested with real hosted credentials; the owner must perform the dashboard setup and auth smoke test below.

After configuring the environment and migration, run `npm install`, `npm run dev`, and open `http://localhost:3000`.

### Repository owner checklist

- [ ] In the Supabase dashboard, confirm the project name and ref under **Project Settings → General**. Compare them with `supabase projects list` before linking.
- [ ] Copy the Project URL and publishable key from **Project Settings → API** into the ignored `.env.local`; set the app's actual origin in `NEXT_PUBLIC_APP_URL`. Do not use a secret or `service_role` key.
- [ ] In **Authentication → URL Configuration**, set the Site URL to the app origin and allow the exact `<NEXT_PUBLIC_APP_URL>/auth/callback` URL. Keep email confirmation enabled.
- [ ] Configure a verified SMTP sender under **Project Settings → Authentication → SMTP Settings** if confirmation messages must reach addresses outside Supabase's default email restrictions; verify delivery to the test inbox.
- [ ] From the repository, run `supabase link --project-ref <PROJECT_REF>`, then the guarded `npm run supabase:push-hosted -- --project-ref <PROJECT_REF>` command and confirm the displayed project name/ref before typing the ref.
- [ ] Start the app and test registration with an inbox you control, follow its verification email, complete business setup, sign out, and sign in again. Confirm the protected workspace redirects unauthenticated users to sign-in.

Hosted authentication is not verified until this real-project checklist has been completed. No hosted project was connected or modified as part of this repository change.

`.env.example` contains placeholders only. Never put a `service_role` or secret key in a `NEXT_PUBLIC_` variable, source file, or browser bundle. The app uses the publishable key and relies on RLS.

## Local database tests

The committed `supabase/config.toml` allows the local callback URLs. With Docker running, start an isolated local stack and apply migrations:

```sh
npx supabase start
npx supabase db reset
npx supabase test db
```

`db reset` is destructive to the local Supabase database only; do not use it against production. The pgTAP suite checks anonymous access, direct membership writes, cross-tenant visibility, and authenticated business creation. Never run local test fixtures against production.

Run the app checks with `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.

## Troubleshooting

- **Supabase is not configured:** set non-placeholder URL and publishable key values in `.env.local`, then restart Next.js.
- **Verification callback fails:** the callback URL must exactly match an allowed Supabase redirect; check the `/auth/callback` entry and `NEXT_PUBLIC_APP_URL`.
- **Workspace setup fails:** confirm the migration is applied and the authenticated user's email is confirmed. The UI intentionally displays generic database errors.
- **Local CLI fails:** ensure Docker is running and local Supabase ports are free; `npx supabase status` reports local service URLs.

## Security foundation

`businesses` and `business_members` have RLS enabled. A user can read a business only through their own membership; membership rows are self-readable and cannot be inserted or edited directly by authenticated clients. `create_business` is the only initial write path. It is a security-definer function with a fixed search path, derives the creator from `auth.uid()`, and atomically creates the business and owner membership. The signup intent stored in Supabase user metadata is only an onboarding hint, never an authorization boundary.

No business records are stored in browser local storage. Authenticated database access is made on the server using the Supabase SSR cookie client. Further tables must receive explicit RLS policies before application access is added.

## Current scope

- Available: responsive product entry page, sign-up/sign-in, email verification callback, sign-out, authenticated tailoring/trading workspace setup, and tenant-scoped workspace listing.
- Registration available, dashboard planned: customer accounts. Order verification, linking, and customer order views are not implemented; no sample orders are shown.
- Planned: tailoring operations, trading operations, file uploads, payments, reporting, notifications, staff permissions, AI assistance, and PWA support.

## Checks

```sh
npm test
npm run lint
npm run typecheck
npm run build
```
