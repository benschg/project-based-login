CREATE TYPE "public"."gdpr_action" AS ENUM('consent_given', 'consent_withdrawn', 'data_exported', 'data_deleted', 'account_created', 'member_invited', 'invitation_created', 'member_removed', 'member_role_changed', 'invitations_claimed');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."privacy_level" AS ENUM('private', 'team', 'public');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TABLE "gdpr_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" "gdpr_action" NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"invited_email" text NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"invited_by" uuid NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" uuid,
	CONSTRAINT "unique_project_email" UNIQUE("project_id","invited_email")
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"invited_by" uuid,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_project_user" UNIQUE("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_id" uuid NOT NULL,
	"privacy_level" "privacy_level" DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"theme" text DEFAULT 'light',
	"language" text DEFAULT 'en',
	"email_notifications" boolean DEFAULT true,
	"data_processing_consent" boolean DEFAULT false,
	"marketing_consent" boolean DEFAULT false,
	"consent_date" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_gdpr_audit_log_user_id" ON "gdpr_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_gdpr_audit_log_created_at" ON "gdpr_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_project_invitations_project_id" ON "project_invitations" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_invitations_email" ON "project_invitations" USING btree ("invited_email");--> statement-breakpoint
CREATE INDEX "idx_project_invitations_status" ON "project_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_project_members_project_id" ON "project_members" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_members_user_id" ON "project_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_projects_owner_id" ON "projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_projects_created_at" ON "projects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_user_preferences_user_id" ON "user_preferences" USING btree ("user_id");