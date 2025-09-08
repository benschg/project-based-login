'use client';

import { useAuth } from './useAuth';

export interface ProjectPermissions {
  canEdit: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canChangeRoles: boolean;
  canDelete: boolean;
  canViewMembers: boolean;
  canViewProject: boolean;
}

export function useProjectPermissions(
  ownerId: string, 
  userRole?: 'admin' | 'member'
): ProjectPermissions {
  const { user } = useAuth();
  
  if (!user) {
    return {
      canEdit: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canChangeRoles: false,
      canDelete: false,
      canViewMembers: false,
      canViewProject: false,
    };
  }

  const isOwner = user.id === ownerId;
  const isAdmin = userRole === 'admin';
  const isMember = userRole === 'member';

  return {
    canEdit: isOwner || isAdmin,
    canInviteMembers: isOwner || isAdmin,
    canRemoveMembers: isOwner,
    canChangeRoles: isOwner,
    canDelete: isOwner,
    canViewMembers: isOwner || isAdmin || isMember,
    canViewProject: isOwner || isAdmin || isMember,
  };
}