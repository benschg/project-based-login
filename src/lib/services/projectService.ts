import { db, projects, projectMembers, projectInvitations, gdprAuditLog } from '@/lib/db';
import { eq, and, count } from 'drizzle-orm';

export interface CreateProjectData {
  name: string;
  description?: string;
  privacyLevel: 'private' | 'team' | 'public';
  ownerId: string;
}

export interface ProjectWithMembers {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  privacyLevel: 'private' | 'team' | 'public';
  createdAt: Date;
  updatedAt: Date;
  members: Array<{
    id: string;
    userId: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    permissions: Record<string, unknown>;
    invitedBy: string | null;
    joinedAt: Date;
  }>;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  privacyLevel: 'private' | 'team' | 'public';
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  isOwner: boolean;
  memberCount: number;
  role?: 'owner' | 'admin' | 'member';
}

export const projectService = {
  async createProject(data: CreateProjectData): Promise<{ id: string }> {
    const [project] = await db.insert(projects).values({
      name: data.name,
      description: data.description || null,
      privacyLevel: data.privacyLevel,
      ownerId: data.ownerId,
    }).returning({ id: projects.id });

    return project;
  },

  async getUserProjects(userId: string): Promise<ProjectSummary[]> {
    // Get owned projects
    const ownedProjects = await db.select().from(projects).where(eq(projects.ownerId, userId));
    
    // Get projects where user is a member
    const memberProjects = await db
      .select({
        project: projects,
        member: projectMembers
      })
      .from(projectMembers)
      .innerJoin(projects, eq(projectMembers.projectId, projects.id))
      .where(eq(projectMembers.userId, userId));

    // Combine and deduplicate
    const allProjectsMap = new Map<string, ProjectSummary>();
    
    // Add owned projects
    ownedProjects.forEach(project => {
      allProjectsMap.set(project.id, { 
        ...project, 
        isOwner: true,
        role: 'owner' as const,
        memberCount: 1
      });
    });
    
    // Add member projects
    memberProjects.forEach(({ project, member }) => {
      if (!allProjectsMap.has(project.id)) {
        allProjectsMap.set(project.id, {
          ...project,
          isOwner: false,
          role: member.role === 'viewer' ? 'member' : member.role,
          memberCount: 1
        });
      }
    });

    // Get member counts for all projects
    const allProjects = Array.from(allProjectsMap.values());
    const projectsWithCounts: ProjectSummary[] = await Promise.all(
      allProjects.map(async (project) => {
        const [memberCountResult] = await db
          .select({ count: count() })
          .from(projectMembers)
          .where(eq(projectMembers.projectId, project.id));

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          privacyLevel: project.privacyLevel,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          ownerId: project.ownerId,
          isOwner: project.isOwner,
          memberCount: (memberCountResult?.count || 0) + 1, // +1 for owner
          role: project.role
        };
      })
    );

    return projectsWithCounts;
  },

  async getProjectById(projectId: string): Promise<ProjectWithMembers | null> {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    
    if (!project) return null;

    const members = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));

    return {
      ...project,
      members: members.map(member => ({
        id: member.id,
        userId: member.userId,
        role: member.role,
        permissions: member.permissions as Record<string, unknown>,
        invitedBy: member.invitedBy,
        joinedAt: member.joinedAt,
      }))
    };
  },

  async inviteMember(
    projectId: string, 
    email: string, 
    role: 'admin' | 'member' | 'viewer', 
    invitedBy: string
  ): Promise<{ id: string }> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const [invitation] = await db.insert(projectInvitations).values({
      projectId,
      invitedEmail: email,
      role,
      invitedBy,
      expiresAt,
    }).returning({ id: projectInvitations.id });

    return invitation;
  },

  async removeMember(projectId: string, userId: string): Promise<void> {
    await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      );
  },

  async logGdprAction(
    userId: string, 
    action: string, 
    details: Record<string, unknown>, 
    userAgent?: string
  ): Promise<void> {
    await db.insert(gdprAuditLog).values({
      userId,
      action: action as 'consent_given' | 'consent_withdrawn' | 'data_exported' | 'data_deleted' | 'account_created' | 'member_invited' | 'invitation_created' | 'member_removed' | 'member_role_changed' | 'invitations_claimed',
      details,
      userAgent,
    });
  }
};