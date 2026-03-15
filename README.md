# Shadhin.io

A free speech platform for Bangladeshi people — share events, chat by district, and engage with your community.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB via Prisma ORM
- **Auth**: NextAuth.js v5 (Google OAuth + email/password)
- **Storage**: AWS S3 (media uploads)
- **Email**: Resend
- **Real-time**: Socket.IO (separate server in `socket-server/`)
- **Styling**: Tailwind CSS v3 + shadcn/ui

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
| `DATABASE_URL` | MongoDB Atlas → connect → connection string |
| `AUTH_SECRET` | Run `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `RESEND_API_KEY` | resend.com → API Keys |
| `FRONTEND_URL` | `http://localhost:3000` locally |
| `AWS_BUCKET_NAME` | Your S3 bucket name |
| `AWS_BUCKET_REGION` | e.g. `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | AWS IAM → create access key |
| `AWS_SECRET_ACCESS_KEY` | Same as above |
| `NEXT_PUBLIC_SOCKET_URL` | URL of your Socket.IO server (see below) |
| `NEXT_PUBLIC_MEASUREMENT_ID` | Google Analytics measurement ID |

### 3. Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials → Create OAuth 2.0 Client
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### 4. AWS S3 setup

1. Create an S3 bucket with public access blocked
2. Add a bucket policy allowing `s3:PutObject` and `s3:GetObject` for your IAM user
3. Enable CORS on the bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": []
  }
]
```

### 5. Database setup

```bash
npx prisma generate
```

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Socket.IO Server (Real-time chat & notifications)

The real-time features require a separate Socket.IO server in `socket-server/`.

```bash
cd socket-server
npm install
cp .env.example .env   # set FRONTEND_URL=http://localhost:3000
npm run dev            # runs on port 4000
```

Set `NEXT_PUBLIC_SOCKET_URL=http://localhost:4000` in your main `.env`.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run email    # Preview email templates
```
