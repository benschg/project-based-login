import { db, userPreferences, projectInvitations, projectMembers } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export interface UserPrefs {
  userId: string;
  displayName: string | null;
  theme: string | null;
  language: string | null;
  emailNotifications: boolean | null;
  dataProcessingConsent: boolean | null;
  marketingConsent: boolean | null;
  consentDate: Date | null;
  updatedAt: Date;
}

export const authService = {
  async getUserPreferences(userId: string): Promise<UserPrefs | null> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    return prefs || null;
  },

  async updateUserPreferences(userId: string, updates: Partial<UserPrefs>): Promise<void> {
    await db
      .insert(userPreferences)
      .values({
        userId,
        ...updates,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...updates,
          updatedAt: new Date(),
        }
      });
  },

  async claimPendingInvitations(userId: string, email: string): Promise<number> {
    // Get valid pending invitations
    const validInvitations = await db
      .select({
        id: projectInvitations.id,
        projectId: projectInvitations.projectId,
        role: projectInvitations.role,
        invitedBy: projectInvitations.invitedBy,
      })
      .from(projectInvitations)
      .where(
        and(
          eq(projectInvitations.invitedEmail, email),
          eq(projectInvitations.status, 'pending')
        )
      );

    if (validInvitations.length === 0) return 0;

    let claimedCount = 0;

    // Process each invitation
    for (const invitation of validInvitations) {
      try {
        // Check if user is already a member
        const existingMember = await db
          .select()
          .from(projectMembers)
          .where(
            and(
              eq(projectMembers.projectId, invitation.projectId),
              eq(projectMembers.userId, userId)
            )
          );

        if (existingMember.length === 0) {
          // Add user as project member
          await db.insert(projectMembers).values({
            projectId: invitation.projectId,
            userId,
            role: invitation.role,
            invitedBy: invitation.invitedBy,
          });
        }

        // Update invitation status
        await db
          .update(projectInvitations)
          .set({
            status: 'accepted',
            acceptedAt: new Date(),
            acceptedBy: userId,
          })
          .where(eq(projectInvitations.id, invitation.id));

        claimedCount++;
      } catch (error) {
        console.error(`Failed to claim invitation ${invitation.id}:`, error);
      }
    }

    return claimedCount;
  }
};