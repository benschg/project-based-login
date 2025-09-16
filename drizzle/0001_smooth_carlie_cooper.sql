CREATE TYPE "public"."currency" AS ENUM('usd', 'eur', 'gbp');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('credit_purchase', 'credit_refund', 'budget_assignment', 'budget_usage', 'budget_withdrawal');--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" "currency" DEFAULT 'usd' NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_session_id" text,
	"project_id" uuid,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_credits" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"currency" "currency" DEFAULT 'usd' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "budget_amount" numeric(10, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "budget_currency" "currency" DEFAULT 'usd';--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_transactions_user_id" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_type" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_transactions_status" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_transactions_project_id" ON "transactions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_created_at" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_transactions_stripe_payment_intent" ON "transactions" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "idx_user_credits_user_id" ON "user_credits" USING btree ("user_id");