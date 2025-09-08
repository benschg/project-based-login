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
  inet
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

// User preferences table
export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id').primaryKey().references(() => sql`auth.users(id)`, { onDelete: 'cascade' }),
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
  ownerId: uuid('owner_id').references(() => sql`auth.users(id)`, { onDelete: 'cascade' }).notNull(),
  privacyLevel: privacyLevelEnum('privacy_level').default('private').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ownerIdIdx: index('idx_projects_owner_id').on(table.ownerId),
  createdAtIdx: index('idx_projects_created_at').on(table.createdAt),
}));

// Project members table
export const projectMembers = pgTable('project_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => sql`auth.users(id)`, { onDelete: 'cascade' }).notNull(),
  role: roleEnum('role').default('member').notNull(),
  permissions: jsonb('permissions').default({}),
  invitedBy: uuid('invited_by').references(() => sql`auth.users(id)`),
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
  invitedBy: uuid('invited_by').references(() => sql`auth.users(id)`, { onDelete: 'cascade' }).notNull(),
  status: invitationStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  acceptedBy: uuid('accepted_by').references(() => sql`auth.users(id)`),
}, (table) => ({
  projectIdIdx: index('idx_project_invitations_project_id').on(table.projectId),
  emailIdx: index('idx_project_invitations_email').on(table.invitedEmail),
  statusIdx: index('idx_project_invitations_status').on(table.status),
  projectEmailUnique: unique('unique_project_email').on(table.projectId, table.invitedEmail),
}));

// GDPR audit log table
export const gdprAuditLog = pgTable('gdpr_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => sql`auth.users(id)`, { onDelete: 'cascade' }),
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

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(sql`auth.users`, {
    fields: [projects.ownerId],
    references: [sql`auth.users.id`],
  }),
  members: many(projectMembers),
  invitations: many(projectInvitations),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(sql`auth.users`, {
    fields: [projectMembers.userId],
    references: [sql`auth.users.id`],
  }),
  invitedByUser: one(sql`auth.users`, {
    fields: [projectMembers.invitedBy],
    references: [sql`auth.users.id`],
  }),
}));

export const projectInvitationsRelations = relations(projectInvitations, ({ one }) => ({
  project: one(projects, {
    fields: [projectInvitations.projectId],
    references: [projects.id],
  }),
  invitedByUser: one(sql`auth.users`, {
    fields: [projectInvitations.invitedBy],
    references: [sql`auth.users.id`],
  }),
  acceptedByUser: one(sql`auth.users`, {
    fields: [projectInvitations.acceptedBy],
    references: [sql`auth.users.id`],
  }),
}));