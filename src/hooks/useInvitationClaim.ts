'use client';

import { useEffect } from 'react';
import { useAuth } from './useAuth';

export function useInvitationClaim() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email) {
      claimPendingInvitations(user.id, user.email);
    }
  }, [user]);

  const claimPendingInvitations = async (userId: string, email: string) => {
    try {
      const response = await fetch('/api/invitations/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        console.error('Failed to claim invitations');
        return;
      }

      const { claimedCount } = await response.json();

      if (claimedCount > 0) {
        console.log(`Successfully claimed ${claimedCount} project invitations`);
      }
    } catch (err) {
      console.error('Error claiming invitations:', err);
    }
  };
}