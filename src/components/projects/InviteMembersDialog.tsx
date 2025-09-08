'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Add,
  Delete,
  Email,
  Person,
  AdminPanelSettings
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase/client';

interface InviteMembersDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onMembersInvited: () => void;
}

interface InviteItem {
  id: string;
  email: string;
  role: 'admin' | 'member';
}

export default function InviteMembersDialog({ 
  open, 
  onClose, 
  projectId, 
  projectName, 
  onMembersInvited 
}: InviteMembersDialogProps) {
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const addInvite = () => {
    if (!newEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (invites.some(invite => invite.email === newEmail.trim())) {
      setError('This email is already in the invite list');
      return;
    }

    const newInvite: InviteItem = {
      id: Date.now().toString(),
      email: newEmail.trim(),
      role: newRole
    };

    setInvites([...invites, newInvite]);
    setNewEmail('');
    setError('');
  };

  const removeInvite = (id: string) => {
    setInvites(invites.filter(invite => invite.id !== id));
  };

  const updateInviteRole = (id: string, role: 'admin' | 'member') => {
    setInvites(invites.map(invite => 
      invite.id === id ? { ...invite, role } : invite
    ));
  };

  const handleSendInvites = async () => {
    if (invites.length === 0) {
      setError('Please add at least one email to invite');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to send invites');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const invite of invites) {
        try {
          // Hobby plan compatible: Create invitation record without sending emails
          // Users with matching emails can later claim these invitations when they sign up
          
          // Create a pending invitation record via API
          const response = await fetch(`/api/projects/${projectId}/invite`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: invite.email,
              role: invite.role
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send invite');
          }

          successCount++;
        } catch (inviteError) {
          console.error('Error processing invite:', inviteError);
          errorCount++;
        }
      }

      if (successCount > 0) {
        setSuccess(`Successfully created ${successCount} invitation${successCount > 1 ? 's' : ''}. Users will be added when they sign up with the invited email address.`);
        setInvites([]);
        onMembersInvited();
        
        // Close dialog after short delay
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 1500);
      }

      if (errorCount > 0) {
        setError(`Failed to send ${errorCount} invitation${errorCount > 1 ? 's' : ''}. Please try again.`);
      }

    } catch (err) {
      console.error('Unexpected error sending invites:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setInvites([]);
      setNewEmail('');
      setNewRole('member');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      addInvite();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Email color="primary" />
          Invite Members to {projectName}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {error && (
            <Alert severity="error">{error}</Alert>
          )}
          
          {success && (
            <Alert severity="success">{success}</Alert>
          )}

          <Typography variant="body2" color="text.secondary">
            Invite team members to collaborate on this project. When someone signs up with an invited email address, they will automatically be added to the project.
          </Typography>

          {/* Add New Invite */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              placeholder="colleague@company.com"
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin' | 'member')}
                label="Role"
                disabled={loading}
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={addInvite}
              disabled={loading || !newEmail.trim()}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              <Add />
            </Button>
          </Box>

          {/* Invite List */}
          {invites.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Pending Invitations ({invites.length})
              </Typography>
              <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                {invites.map((invite) => (
                  <ListItem key={invite.id}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {invite.role === 'admin' ? (
                            <AdminPanelSettings fontSize="small" color="secondary" />
                          ) : (
                            <Person fontSize="small" color="action" />
                          )}
                          {invite.email}
                        </Box>
                      }
                      secondary={
                        <FormControl size="small" sx={{ minWidth: 100, mt: 0.5 }}>
                          <Select
                            value={invite.role}
                            onChange={(e) => updateInviteRole(invite.id, e.target.value as 'admin' | 'member')}
                            disabled={loading}
                          >
                            <MenuItem value="member">Member</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                          </Select>
                        </FormControl>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => removeInvite(invite.id)}
                        disabled={loading}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Role Permissions:</strong>
            </Typography>
            <Typography variant="caption" display="block">
              • <strong>Member:</strong> Can view project, add comments, and collaborate
            </Typography>
            <Typography variant="caption" display="block">
              • <strong>Admin:</strong> All member permissions plus manage settings and invite others
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSendInvites}
          variant="contained" 
          disabled={loading || invites.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <Email />}
        >
          {loading ? 'Sending...' : `Send ${invites.length} Invitation${invites.length > 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}