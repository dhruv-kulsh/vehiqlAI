# Vehiql (Vehiql AI)

Vehiql is a car listing and admin dashboard Next.js application with built-in AI-powered image extraction and management tools. It combines authentication (Clerk), image storage (Supabase), a Prisma/Postgres backend, and AI integrations to help add and list vehicles faster.

## Key features

- Browse and filter car listings (search, make, body type, fuel type, transmission, price range, sort).
- Pagination-enabled car listing with server-side pagination.
- Admin panel to add new cars, upload images and manage inventory.
- AI-powered image analysis: upload an image and extract car details (make, model, year, color, mileage, transmission, fuel type, price estimate, description, confidence). Supported via Gemini or OpenAI depending on configuration.
- Image storage using Supabase storage buckets and public URLs for serving images.
- Authentication powered by Clerk for admin and user flows.
- Prisma ORM for database models and migrations.

## Local development

Prerequisites:

- Node.js (v18+ recommended)
- npm, yarn, or pnpm
- A Postgres database (local or hosted) for Prisma
- Supabase project (for image storage)
- Clerk project for authentication
- (Optional) OpenAI or Google Generative API credentials for AI features

1. Install dependencies

```bash
npm install
```

2. Environment variables

Create a `.env.local` (gitignored) at the project root and add the required variables. Example variables used in this project (fill with your values):

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DBNAME"
DIRECT_URL="postgresql://..." # optional for migrations

NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...

GEMINI_API_KEY=AIza...            # Google Generative API key (if using Gemini)


3. Prisma setup (local dev)

If you're using a local development database, run migrations and generate the client:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Run the app

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

Notes:
- Restart the dev server after changing `.env.local` so Next picks up new variables.
- Do not commit `.env.local` or any secret keys.

## Production / Deploy

This project is configured for deployment on typical Next.js hosts (Vercel, etc.).

1. Build and start

```bash
npm run build
npm run start
```

2. Environment in production

Set the same environment variables in your hosting provider's dashboard (Vercel Environment Variables, Netlify, etc.). Ensure any AI keys and database URLs are set securely.

3. Deployed website link

Replace the placeholder below with your deployed URL after you deploy the app:

Deployed site: https://your-deployed-site.example.com

## Troubleshooting

- Pagination not showing: the pagination UI is only rendered when there are more pages than the configured page limit. Reduce `limit` in `app/(main)/cars/_components/cars-listing.jsx` to test pagination locally.
- AI extraction errors: ensure the API key (Gemini or OpenAI) is valid, billing enabled, and the chosen model supports vision. Use the helper scripts in `scripts/` to list models or test the key.
- Images not uploading: confirm `NEXT_PUBLIC_SUPABASE_URL` and Supabase service keys are set and that the `car-images` bucket exists and is public (or adjust code to generate signed URLs).

## Useful commands

- Start dev server: `npm run dev`
- Build: `npm run build`
- Start production: `npm run start`
- Run Prisma migrations: `npx prisma migrate dev` (development only)

## Project structure (high level)

- `app/` - Next.js App Router pages and components
- `actions/` - server-side actions (car listing, admin actions, AI processing)
- `components/` - shared UI components (cards, pagination, UI primitives)
- `lib/` - helpers (prisma client, supabase client, utils)
- `prisma/` - Prisma schema and migration files
- `public/` - static assets