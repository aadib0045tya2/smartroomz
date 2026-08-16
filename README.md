# Smart Roomz USA

A responsive furnished-room marketplace for Metro Atlanta, built from the approved Smart Roomz interactive prototype.

## Features

- Location, move-in date, room-type, and payment-frequency search
- Combined filters, sorting, categories, and list/map views
- Data-driven furnished-room listings and image galleries
- Weekly, bi-weekly, and monthly move-in pricing
- Persistent saved rooms and local applications
- Validated multi-step application and request-a-call flows
- Responsive desktop, tablet, and mobile navigation

## Local development

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:5174`.

## Validation

```bash
npm run lint
npm run build
```

## Current scope

The app uses local mock property data and safe `localStorage` persistence. Backend services, authentication, payments, CRM submission, and external APIs are intentionally deferred.
