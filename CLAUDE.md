# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Next.js dev server
npm run build      # Prisma generate + Next.js build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run email      # Start React Email dev server (preview email templates)
```

There are no automated tests in this project.

## Architecture Overview

This is a **Next.js 14 App Router** full-stack application — a social/community platform for Bangladesh called Shadhin.io. It uses the MongoDB + Prisma ORM for data, NextAuth.js v5 (beta) for authentication, AWS S3 for media storage, Resend for emails, and Socket.IO for real-time features.

### Route Structure

- `app/(auth)/` — Public auth pages (login, signup, verify-email, forgot-password)
- `app/(protected)/` — Authenticated routes with shared Navbar layout
  - `events/[stateName]/` — Events filtered by Bangladesh state
  - `live-chat/[stateName]/` — Real-time state-based chat rooms
  - `user/[userId]/` — User profiles
  - `leaderboard/` — Points-based leaderboard
  - `admin/` — Admin dashboard (requires ADMIN role)
- `app/api/auth/[...nextauth]/` — NextAuth handler
- `app/api/data/` — Additional API routes

### Key Patterns

**Server Actions** (`actions/`): All mutations (create event, like, comment, send message, etc.) use Next.js Server Actions with `"use server"`. Validated with Zod, followed by `revalidatePath`/`revalidateTag` calls.

**Data Layer** (`data/`): Read-only database queries separated from actions. Import `db` from `@/lib/db` (Prisma singleton).

**Auth** (`auth.ts` + `middleware.ts` + `routes.ts`): NextAuth JWT sessions. Middleware enforces route protection using `routes.ts` which defines public, auth-only, and admin-only route arrays. Session includes `role` and `id` fields (augmented in `next-auth.d.ts`).

**Real-time** (`context/SocketProvider.tsx`): Socket.IO client wraps protected routes. Users auto-join rooms by `stateName` for chat and notifications.

**File Uploads**: AWS S3 with pre-signed URLs. Media URLs are stored in MongoDB; S3 bucket is `utopia-web-app` (ap-south-1 region).

**Email** (`emails/`, `lib/mail.ts`): React Email templates sent via Resend. Batch limit: 50 recipients per call.

### Environment Variables

See `.env.example` — requires: `DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `FRONTEND_URL`, `AWS_BUCKET_NAME`, `AWS_BUCKET_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_MEASUREMENT_ID`.

### Path Aliases

`@/*` maps to the project root (e.g., `@/lib/db`, `@/components/ui/button`, `@/actions/event`).

### UI Components

shadcn/ui components live in `components/ui/`. Add new ones via `npx shadcn@latest add <component>`. Theme (dark/light) is managed by `components/theme-provider.tsx` using `next-themes`.

### Database

Prisma schema at `prisma/schema.prisma` (MongoDB provider). Run `npx prisma generate` after schema changes (also runs automatically on `npm run build`). Main models: `User`, `Event`, `Comment`, `Like`, `EventAttendee`, `Message`, `Notification`, `Report`.
