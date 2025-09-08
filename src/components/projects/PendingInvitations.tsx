'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import {
  Delete,
  Email,
  AccessTime,
  AdminPanelSettings,
  Person
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase/client';

interface PendingInvitation {
  id: string;
  invited_email: string;
  role: 'admin' | 'member';
  created_at: string;
  expires_at: string;
  invited_by: string;
}

interface PendingInvitationsProps {
  projectId: string;
  onInvitationRevoked?: () => void;
}

export default function PendingInvitations({ projectId, onInvitationRevoked }: PendingInvitationsProps) {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_invitations')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading invitations:', error);
        return;
      }

      setInvitations(data || []);
    } catch (err) {
      console.error('Error loading invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const revokeInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('project_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('Error revoking invitation:', error);
        return;
      }

      // Refresh the list
      loadInvitations();
      onInvitationRevoked?.();
    } catch (err) {
      console.error('Error revoking invitation:', err);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [projectId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  if (invitations.length === 0) {
    return null; // Don't show anything if no pending invitations
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Email color="primary" />
          <Typography variant="h6">
            Pending Invitations ({invitations.length})
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          These users will automatically join when they sign up with the invited email address.
        </Alert>

        <List dense>
          {invitations.map((invitation) => (
            <ListItem key={invitation.id}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {invitation.role === 'admin' ? (
                      <AdminPanelSettings fontSize="small" color="secondary" />
                    ) : (
                      <Person fontSize="small" color="action" />
                    )}
                    {invitation.invited_email}
                    <Chip
                      label={invitation.role}
                      size="small"
                      color={invitation.role === 'admin' ? 'secondary' : 'default'}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <AccessTime fontSize="small" />
                    <Typography variant="caption">
                      Invited {formatDate(invitation.created_at)} • 
                      Expires {formatDate(invitation.expires_at)}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => revokeInvitation(invitation.id)}
                  size="small"
                >
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}