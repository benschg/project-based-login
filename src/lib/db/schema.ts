import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  unique,
  pgEnum,
  inet,
  decimal,
  integer
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const privacyLevelEnum = pgEnum('privacy_level', ['private', 'team', 'public']);
export const roleEnum = pgEnum('member_role', ['owner', 'admin', 'member', 'viewer']);
export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'declined', 'expired']);
export const gdprActionEnum = pgEnum('gdpr_action', [
  'consent_given',
  'consent_withdrawn', 
  'data_exported',
  'data_deleted',
  'account_created',
  'member_invited',
  'invitation_created',
  'member_removed',
  'member_role_changed',
  'invitations_claimed'
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'credit_purchase',
  'credit_refund',
  'budget_assignment',
  'budget_usage',
  'budget_withdrawal'
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'completed',
  'failed',
  'cancelled',
  'refunded'
]);

export const currencyEnum = pgEnum('currency', ['usd', 'eur', 'gbp']);

// User preferences table
export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id').primaryKey(),
  displayName: text('display_name'),
  theme: text('theme').default('light'),
  language: text('language').default('en'),
  emailNotifications: boolean('email_notifications').default(true),
  dataProcessingConsent: boolean('data_processing_consent').default(false),
  marketingConsent: boolean('marketing_consent').default(false),
  consentDate: timestamp('consent_date', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_user_preferences_user_id').on(table.userId),
}));

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').notNull(),
  privacyLevel: privacyLevelEnum('privacy_level').default('private').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  budgetAmount: decimal('budget_amount', { precision: 10, scale: 2 }).default('0.00'),
  budgetCurrency: currencyEnum('budget_currency').default('usd'),
}, (table) => ({
  ownerIdIdx: index('idx_projects_owner_id').on(table.ownerId),
  createdAtIdx: index('idx_projects_created_at').on(table.createdAt),
}));

// Project members table
export const projectMembers = pgTable('project_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').notNull(),
  role: roleEnum('role').default('member').notNull(),
  permissions: jsonb('permissions').default({}),
  invitedBy: uuid('invited_by'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index('idx_project_members_project_id').on(table.projectId),
  userIdIdx: index('idx_project_members_user_id').on(table.userId),
  projectUserUnique: unique('unique_project_user').on(table.projectId, table.userId),
}));

// Project invitations table
export const projectInvitations = pgTable('project_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  invitedEmail: text('invited_email').notNull(),
  role: roleEnum('role').default('member').notNull(),
  invitedBy: uuid('invited_by').notNull(),
  status: invitationStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  acceptedBy: uuid('accepted_by'),
}, (table) => ({
  projectIdIdx: index('idx_project_invitations_project_id').on(table.projectId),
  emailIdx: index('idx_project_invitations_email').on(table.invitedEmail),
  statusIdx: index('idx_project_invitations_status').on(table.status),
  projectEmailUnique: unique('unique_project_email').on(table.projectId, table.invitedEmail),
}));

// User credits table
export const userCredits = pgTable('user_credits', {
  userId: uuid('user_id').primaryKey(),
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  currency: currencyEnum('currency').default('usd').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_user_credits_user_id').on(table.userId),
}));

// Transactions table
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  type: transactionTypeEnum('type').notNull(),
  status: transactionStatusEnum('status').default('pending').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum('currency').default('usd').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeSessionId: text('stripe_session_id'),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  description: text('description'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  userIdIdx: index('idx_transactions_user_id').on(table.userId),
  typeIdx: index('idx_transactions_type').on(table.type),
  statusIdx: index('idx_transactions_status').on(table.status),
  projectIdIdx: index('idx_transactions_project_id').on(table.projectId),
  createdAtIdx: index('idx_transactions_created_at').on(table.createdAt),
  stripePaymentIntentIdx: index('idx_transactions_stripe_payment_intent').on(table.stripePaymentIntentId),
}));

// GDPR audit log table
export const gdprAuditLog = pgTable('gdpr_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  action: gdprActionEnum('action').notNull(),
  details: jsonb('details').default({}),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_gdpr_audit_log_user_id').on(table.userId),
  createdAtIdx: index('idx_gdpr_audit_log_created_at').on(table.createdAt),
}));

// Relations for better TypeScript inference
import { relations } from 'drizzle-orm';

export const projectsRelations = relations(projects, ({ many }) => ({
  members: many(projectMembers),
  invitations: many(projectInvitations),
  transactions: many(transactions),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
}));

export const projectInvitationsRelations = relations(projectInvitations, ({ one }) => ({
  project: one(projects, {
    fields: [projectInvitations.projectId],
    references: [projects.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  project: one(projects, {
    fields: [transactions.projectId],
    references: [projects.id],
  }),
}));