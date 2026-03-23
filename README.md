# Shadhin.io

Bangladesh's district-based social platform — events, live chat, and community discussions organized by district.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript strict)
- **Database**: MongoDB via Prisma ORM
- **Auth**: NextAuth.js v5 (Google OAuth + email/password)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Cache**: Upstash Redis (feed cache, rate limiting, feature flags)
- **Email**: Resend + React Email templates
- **Real-time**: HTTP polling (chat 4s, notifications 10s)
- **Styling**: Tailwind CSS + shadcn/ui
- **Analytics**: GA4 + Microsoft Clarity + Meta Pixel + Vercel Analytics
- **Moderation**: OpenAI moderation API + keyword fallback
- **Push**: Web Push (VAPID)
- **Deployed on**: Vercel (Hobby plan)

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/RhidoyPro/Shadhin.git
cd Shadhin
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | MongoDB Atlas connection string |
| `AUTH_SECRET` | Run `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `RESEND_API_KEY` | resend.com |
| `FRONTEND_URL` | `http://localhost:3000` locally |
| `AWS_BUCKET_NAME` | Cloudflare R2 bucket name (`shadhin`) |
| `AWS_BUCKET_REGION` | `auto` (R2 uses auto) |
| `AWS_ACCESS_KEY_ID` | Cloudflare R2 API token |
| `AWS_SECRET_ACCESS_KEY` | Same as above |
| `AWS_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_URL` | Your R2 public bucket URL |
| `UPSTASH_REDIS_REST_URL` | upstash.com |
| `UPSTASH_REDIS_REST_TOKEN` | Same as above |
| `NEXT_PUBLIC_MEASUREMENT_ID` | Google Analytics 4 measurement ID |

> Note: Prisma errors during local dev are expected if `DATABASE_URL` is not set. The app uses Upstash Redis with an in-memory fallback for rate limiting.

### 3. Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project > APIs & Services > Credentials > Create OAuth 2.0 Client
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### 4. Database setup

```bash
npx prisma generate
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Prisma generate + Next.js build
npm run lint     # Run ESLint
npm run email    # Preview email templates (React Email)
```
