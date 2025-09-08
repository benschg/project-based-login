# Project-Based Login Application (GDPR Compliant)

## Overview
A React-based application with passwordless email authentication via Supabase, multi-project management with user sharing, and full GDPR compliance. Designed for Vercel Hobby plan deployment.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Material-UI (MUI)
- **Backend**: Supabase (PostgreSQL + Built-in Email Auth + APIs)
- **Email**: Supabase built-in email service (magic links)
- **Deployment**: Vercel Hobby plan
- **State Management**: React Context + SWR for data fetching
- **Privacy**: GDPR-compliant design with minimal data collection

## Email Strategy (Vercel Hobby Compatible)
- **Supabase handles all emails** - magic links, verification, notifications
- **No custom SMTP needed** - works with Vercel Hobby plan
- **Supabase-branded emails** - professional appearance
- **Zero additional email costs** - included in Supabase free tier
- **Reliable delivery** - Supabase manages email infrastructure

## GDPR Compliance Strategy

### Data Minimization
- **No PII in application database** - only in Supabase Auth
- **Pseudonymous user references** - UUIDs only
- **Optional profile data** - user controls what to share
- **Project data separation** - no personal info in project tables

### User Rights Implementation
- **Right to Access** - data export functionality
- **Right to Rectification** - profile editing
- **Right to Erasure** - complete account deletion
- **Right to Portability** - JSON data export
- **Consent Management** - granular privacy controls

## Architecture

### Database Schema (GDPR Compliant)
```sql
-- Users managed by Supabase Auth (auth.users)
-- Contains: id, email, email_confirmed_at, created_at
-- NO additional PII stored in application tables

-- Optional user preferences (minimal data)
user_preferences (
  user_id uuid references auth.users primary key,
  display_name text, -- Optional, user-controlled
  theme text default 'light',
  language text default 'en',
  email_notifications boolean default true,
  data_processing_consent boolean default false,
  marketing_consent boolean default false,
  consent_date timestamp,
  updated_at timestamp default now()
)

-- Projects (no owner personal info)
projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  owner_id uuid references auth.users not null, -- Just UUID reference
  privacy_level text default 'private', -- 'private', 'team', 'public'
  created_at timestamp default now(),
  updated_at timestamp default now()
)

-- Project members (anonymous references only)
project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects on delete cascade,
  user_id uuid references auth.users on delete cascade, -- Just UUID reference
  role text default 'member', -- 'owner', 'admin', 'member', 'viewer'
  permissions jsonb default '{}',
  invited_by uuid references auth.users,
  joined_at timestamp default now(),
  unique(project_id, user_id)
)

-- GDPR audit log (for compliance tracking)
gdpr_audit_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  action text not null, -- 'consent_given', 'data_exported', 'data_deleted'
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp default now()
)
```

### Privacy-First Project Structure
```
/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Magic link request form
│   │   ├── auth/           # Auth callback handling
│   │   └── verify/         # Email verification
│   ├── dashboard/
│   │   ├── projects/
│   │   ├── privacy/        # GDPR controls
│   │   └── settings/
│   ├── privacy/            # Privacy policy, terms
│   │   ├── policy/
│   │   ├── terms/
│   │   └── cookies/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           # Landing page
├── components/
│   ├── auth/
│   │   ├── MagicLinkForm.tsx
│   │   └── AuthCallback.tsx
│   ├── privacy/
│   │   ├── ConsentManager.tsx
│   │   ├── DataExporter.tsx
│   │   └── AccountDeletion.tsx
│   ├── projects/
│   └── ui/
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # Browser client
│   │   ├── server.ts      # Server client
│   │   └── middleware.ts  # Auth middleware
│   ├── gdpr/
│   │   ├── consent.ts
│   │   ├── data-export.ts
│   │   └── data-deletion.ts
│   └── utils/
├── hooks/
│   ├── useAuth.ts
│   ├── useGDPRConsent.ts
│   └── usePrivacySettings.ts
└── middleware.ts          # Next.js auth middleware
```

## Key Features

### 1. Passwordless Authentication (Supabase Email)
- **Magic link login** - Supabase sends professional emails
- **Email verification** - automated by Supabase
- **Session management** - secure JWT tokens
- **No password complexity** - improved UX and security

### 2. Supabase Email Templates
```javascript
// Magic link email (sent by Supabase)
{
  "subject": "Sign in to [Your App Name]",
  "body": "Click the link below to sign in securely..."
}

// Email customization in Supabase dashboard:
// - Custom app name and logo
// - Brand colors and styling  
// - Custom redirect URLs
// - Email template overrides
```

### 3. GDPR Compliance Features
- **Consent management** - granular privacy controls
- **Data export** - complete user data in JSON format
- **Account deletion** - permanent removal with audit trail
- **Cookie consent** - minimal tracking, user-controlled
- **Privacy dashboard** - transparency and control

### 4. Privacy-First Project Management
- **Anonymous project references** - no personal info stored
- **Privacy levels** - private, team, or public projects
- **Minimal sharing data** - only functional requirements
- **User-controlled visibility** - optional display names

## Authentication Flow (Supabase Magic Links)

### Login Process
1. User enters email in login form
2. `supabase.auth.signInWithOtp({ email })` called
3. Supabase sends branded magic link email
4. User clicks link → redirected to `/auth/callback`
5. Session established automatically
6. Redirect to dashboard or intended page

### Code Example
```typescript
// components/auth/MagicLinkForm.tsx
const handleLogin = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (!error) {
    setMessage('Check your email for the login link!');
  }
};
```

## Environment Variables (Vercel Hobby)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# No email service needed - Supabase handles it!

# GDPR Compliance
NEXT_PUBLIC_APP_NAME="Your App Name"
GDPR_DATA_PROCESSOR_EMAIL="privacy@yourcompany.com"
GDPR_DATA_RETENTION_DAYS=2555
```

## Quick Start Setup

### Prerequisites (Manual Setup - 7 minutes total)

**1. Supabase Account Setup (5 minutes):**
```bash
# 1. Go to https://supabase.com → Sign up
# 2. Create new project → Choose region  
# 3. Wait for database provisioning (~2 minutes)
# 4. Go to Settings → API → Copy:
#    - Project URL
#    - Anon public key
```

**2. Vercel Account Setup (2 minutes):**
```bash
# 1. Go to https://vercel.com → Sign up with GitHub
# 2. That's it! We'll deploy via CLI later
```

### Development Setup (Automated)

**1. Initialize Next.js Project:**
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app
npm install @supabase/supabase-js @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material @mui/x-data-grid swr
npm run dev
```

**2. Environment Variables:**
```bash
# Create .env.local file with your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_NAME="Your App Name"
GDPR_DATA_PROCESSOR_EMAIL="privacy@yourcompany.com"
```

**3. Supabase Configuration (Programmatic):**
```sql
-- Run these SQL commands in Supabase Dashboard → SQL Editor
-- (All schema creation will be provided as code)
```

### Deployment Commands
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Add environment variables to Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Vercel Hobby Plan Benefits
- **Free tier sufficient** for magic link auth
- **No email costs** - Supabase handles delivery
- **Custom domains** - professional appearance
- **SSL certificates** - automatic HTTPS
- **Edge functions** - for auth middleware

## Email Limitations & Solutions

### Supabase Email Limits
- **Free tier**: 3 auth emails per hour per user
- **Paid tier**: Higher limits available
- **Custom branding**: Requires Supabase Pro plan

### Professional Appearance
- Configure app name in Supabase dashboard
- Set custom logo and colors
- Use custom domain for redirect URLs
- Professional "from" name display

## Cost Structure
- **Vercel Hobby**: Free (with limits)
- **Supabase Free**: Up to 50k monthly active users
- **Total monthly cost**: $0 for small applications
- **Scaling**: Upgrade Supabase when needed

## GDPR Implementation Details

### Data Export Format
```json
{
  "exportDate": "2024-01-01T00:00:00Z",
  "userData": {
    "id": "uuid",
    "email": "user@example.com",
    "emailConfirmed": true,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "preferences": {
    "displayName": "Optional Name",
    "theme": "light",
    "emailNotifications": true,
    "consentHistory": [...]
  },
  "projects": [
    {
      "id": "uuid",
      "name": "Project Name",
      "role": "owner",
      "joinedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Legal Compliance
- **GDPR Article 6**: Consent as lawful basis
- **Cookie consent**: Essential cookies only
- **Data retention**: Configurable cleanup
- **Breach notification**: Automated monitoring
- **Privacy by design**: Minimal data collection

## Production Deployment

### Vercel Deployment
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically on push
4. Configure custom domain (optional)

### Supabase Production Setup
1. Create production project
2. Configure authentication settings
3. Set up database schema
4. Enable Row Level Security
5. Configure email templates

This approach provides a complete, GDPR-compliant solution with zero email infrastructure costs while maintaining professional functionality.