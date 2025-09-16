# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payments for the project-based login application. The integration includes credit purchases, project budget assignments, and transaction tracking.

## Overview

The payment system allows:
- Users to purchase credits via Stripe Checkout
- Project owners/admins to assign budgets to projects using their credits
- Complete transaction history and audit trails
- Webhook handling for payment confirmations

## Prerequisites

1. **Stripe Account**: Create a free Stripe account at [https://stripe.com](https://stripe.com)
2. **Supabase Database**: Ensure your database is running and accessible
3. **Environment Variables**: Access to your `.env.local` file

## Step 1: Stripe Dashboard Setup (5 minutes)

### 1.1 Create Stripe Account
1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up with your email and verify your account
3. Complete business information (can skip initially for testing)

### 1.2 Get API Keys
1. Navigate to **Developers** → **API Keys**
2. Copy your **Publishable key** and **Secret key**
3. For testing, use the keys that start with `pk_test_` and `sk_test_`

### 1.3 Create Webhook Endpoint
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://your-domain.vercel.app/api/payments/webhook`
   - For local development: `https://your-ngrok-url.ngrok.io/api/payments/webhook`
4. Select these events to listen for:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
   - `charge.dispute.created`
5. Click **Add endpoint**
6. Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 2: Environment Variables Setup

Add the following variables to your `.env.local` file:

```env
# Existing variables...
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_supabase_database_url

# Stripe Configuration (ADD THESE)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Important**: 
- Never commit these keys to version control
- Use test keys for development (they start with `sk_test_` and `pk_test_`)
- The webhook secret is different for each webhook endpoint

## Step 3: Database Migration

The new payment tables have been generated. Apply them to your database:

```bash
# Apply the database migrations
yarn db:migrate

# Or manually run the SQL in Supabase SQL Editor
# The migration file is in: drizzle/0001_smooth_carlie_cooper.sql
```

### Manual Migration (Alternative)
If the automatic migration fails, you can run this SQL directly in Supabase SQL Editor:

```sql
-- Create enums
CREATE TYPE "public"."transaction_type" AS ENUM('credit_purchase', 'credit_refund', 'budget_assignment', 'budget_usage', 'budget_withdrawal');
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded');
CREATE TYPE "public"."currency" AS ENUM('usd', 'eur', 'gbp');

-- Add budget columns to projects table
ALTER TABLE "projects" ADD COLUMN "budget_amount" numeric(10,2) DEFAULT '0.00';
ALTER TABLE "projects" ADD COLUMN "budget_currency" "currency" DEFAULT 'usd';

-- Create user_credits table
CREATE TABLE "user_credits" (
    "user_id" uuid PRIMARY KEY,
    "balance" numeric(10,2) DEFAULT '0.00' NOT NULL,
    "currency" "currency" DEFAULT 'usd' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create transactions table
CREATE TABLE "transactions" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid NOT NULL,
    "type" "transaction_type" NOT NULL,
    "status" "transaction_status" DEFAULT 'pending' NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "currency" DEFAULT 'usd' NOT NULL,
    "stripe_payment_intent_id" text,
    "stripe_session_id" text,
    "project_id" uuid REFERENCES projects(id) ON DELETE SET NULL,
    "description" text,
    "metadata" jsonb DEFAULT '{}',
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "completed_at" timestamp with time zone
);

-- Create indexes
CREATE INDEX "idx_user_credits_user_id" ON "user_credits" ("user_id");
CREATE INDEX "idx_transactions_user_id" ON "transactions" ("user_id");
CREATE INDEX "idx_transactions_type" ON "transactions" ("type");
CREATE INDEX "idx_transactions_status" ON "transactions" ("status");
CREATE INDEX "idx_transactions_project_id" ON "transactions" ("project_id");
CREATE INDEX "idx_transactions_created_at" ON "transactions" ("created_at");
CREATE INDEX "idx_transactions_stripe_payment_intent" ON "transactions" ("stripe_payment_intent_id");
```

## Step 4: Local Development Testing

### 4.1 Start the Development Server
```bash
yarn dev
```

### 4.2 Test the Payment Flow
1. Navigate to `http://localhost:3000/dashboard/credits`
2. Click "Buy Credits" 
3. Select an amount and click "Purchase"
4. You'll be redirected to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any valid ZIP code

### 4.3 Set Up Webhook Testing (for local development)
1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Login to Stripe CLI: `stripe login`
3. Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```
4. The CLI will output a webhook signing secret - use this in your `.env.local`

## Step 5: Project Budget Testing

1. Purchase some credits first (Step 4.2)
2. Navigate to any project you own or admin
3. Go to the "Budget" tab
4. Click "Assign Budget"
5. Enter an amount (less than your available balance)
6. Confirm the assignment

## Step 6: Production Deployment

### 6.1 Update Environment Variables in Vercel
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the production Stripe keys:
```
STRIPE_SECRET_KEY=sk_live_your_production_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
```

### 6.2 Update Webhook Endpoint
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Edit your webhook endpoint
3. Change URL to your production domain: `https://yourapp.vercel.app/api/payments/webhook`

### 6.3 Activate Live Mode
1. In Stripe Dashboard, toggle from "Test mode" to "Live mode"
2. Complete business verification if required
3. Test with real payment methods

## Features Implemented

### 💳 Credit Purchase System
- Secure Stripe Checkout integration
- Multiple currency support (USD, EUR, GBP)
- Predefined amount buttons and custom amounts
- Automatic balance updates via webhooks

### 🏗️ Project Budget Management
- Owners and admins can assign budgets to projects
- Real-time balance validation
- Automatic credit deduction
- Budget tracking per project

### 📊 Transaction History
- Complete audit trail of all transactions
- Transaction types: purchases, assignments, refunds
- Status tracking: pending, completed, failed
- Expandable history view

### 🔒 Security Features
- Server-side webhook verification
- GDPR-compliant transaction logging
- Secure API routes with authentication
- Input validation and error handling

## Payment Flow Diagram

```
User Purchase Flow:
User clicks "Buy Credits" 
→ Creates checkout session 
→ Redirects to Stripe Checkout 
→ User pays with card 
→ Stripe webhook confirms payment 
→ Credits added to user balance 
→ User redirected back with success message

Budget Assignment Flow:
Owner clicks "Assign Budget" 
→ Validates user balance 
→ Creates budget assignment transaction 
→ Deducts from user credits 
→ Adds to project budget 
→ Updates UI with new balances
```

## Troubleshooting

### Common Issues

**1. Database Connection Errors**
- Verify `DATABASE_URL` in `.env.local`
- Ensure Supabase project is running
- Check database password in connection string

**2. Webhook Signature Verification Failed**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Ensure webhook endpoint URL is correct
- Check that webhook is receiving events

**3. Payment Not Completing**
- Check browser developer console for errors
- Verify Stripe keys are correct and from same account
- Ensure webhook events are being delivered

**4. "Insufficient Balance" Errors**
- Verify user has completed a successful credit purchase
- Check user_credits table for correct balance
- Ensure currency matches between credits and assignment

### Test Cards
```
Successful payment: 4242 4242 4242 4242
Declined payment: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
```

## Next Steps

After setup is complete, you can:
1. **Customize pricing**: Modify predefined amounts in `CreditPurchaseDialog.tsx`
2. **Add usage tracking**: Implement budget consumption for project activities
3. **Enhanced reporting**: Add charts and analytics to transaction history
4. **Subscription billing**: Extend to support recurring payments
5. **Multi-currency**: Add automatic currency conversion

## Support

If you encounter issues:
1. Check the Stripe Dashboard logs
2. Review browser developer console
3. Check Next.js server logs
4. Verify webhook delivery in Stripe Dashboard

The payment system is now fully integrated and ready for testing! 🎉