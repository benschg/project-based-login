'use client';

import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';

export function useInvitationClaim() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email) {
      claimPendingInvitations(user.id, user.email);
    }
  }, [user]);

  const claimPendingInvitations = async (userId: string, email: string) => {
    try {
      // First check if there are any valid invitations to claim
      const { data: pendingInvitations, error: checkError } = await supabase
        .from('project_invitations')
        .select('project_id, projects!inner(owner_id)')
        .eq('invited_email', email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (checkError) {
        console.error('Error checking invitations:', checkError);
        return;
      }

      // Filter out invitations where user is already the project owner
      const validInvitations = (pendingInvitations || []).filter(
        inv => inv.projects.owner_id !== userId
      );

      if (validInvitations.length === 0) {
        return; // No valid invitations to claim
      }

      // Call the claim function we created in the database
      const { data, error } = await supabase.rpc('claim_project_invitations', {
        p_user_id: userId,
        p_email: email
      });

      if (error) {
        console.error('Error claiming invitations:', error);
        return;
      }

      if (data && data > 0) {
        console.log(`Successfully claimed ${data} project invitations`);
        
        // Log GDPR action
        try {
          await supabase.rpc('log_gdpr_action', {
            p_user_id: userId,
            p_action: 'invitations_claimed',
            p_details: { 
              claimed_count: data,
              email: email
            },
            p_ip_address: null,
            p_user_agent: navigator.userAgent,
          });
        } catch (logError) {
          console.warn('Failed to log GDPR action:', logError);
        }
      }
    } catch (err) {
      console.error('Error claiming invitations:', err);
    }
  };
}