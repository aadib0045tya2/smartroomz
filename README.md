# Smart Roomz USA

A responsive furnished-room marketplace for Metro Atlanta, built from the approved Smart Roomz interactive prototype.

## Features

- Location, move-in date, room-type, and payment-frequency search
- Combined filters, sorting, categories, and list/map views
- Data-driven furnished-room listings and image galleries
- Weekly, bi-weekly, and monthly move-in pricing
- Persistent saved rooms and local applications
- Validated multi-step application and request-a-call flows
- Supabase-backed customer accounts and operations CRM
- Square room-hold deposits with server-controlled amounts
- Admin-managed listings, leads, holds, and team access
- Read-only Vapi call synchronization and conversion reporting
- Responsive desktop, tablet, and mobile navigation

## Local development

```bash
npm install
npm run dev
```

The development server runs at the URL printed by Vite.

Copy `.env.example` to `.env.local` and provide the project credentials. Vapi
reporting uses an existing private key only in the server environment; it never
places that key in the browser and does not change Vapi configuration.

## Call reporting

The admin **Calling dashboard** reads from the RLS-protected `vapi_calls` table.
`/api/vapi-sync` polls Vapi's call-list API and upserts immutable call IDs, so
rerunning the sync is safe. Vercel calls the endpoint daily, and admins can use
**Sync now** for an immediate full refresh. Set these server-only variables:

```text
VAPI_PRIVATE_KEY=<existing Vapi private key>
CRON_SECRET=<long random value>
```

Client conversion automatically excludes `+1 404-951-3737` (Dossy) and
`+91 8958875538` (owner test calls). Appointment-creation tool calls are the
strongest booking signal, and transfers to Dossy are tracked independently.

## Validation

```bash
npm run lint
npm run build
```
