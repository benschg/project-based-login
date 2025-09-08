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
  CircularProgress
} from '@mui/material';
import { supabase } from '@/lib/supabase/client';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export default function CreateProjectDialog({ open, onClose, onProjectCreated }: CreateProjectDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy_level: 'private'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to create a project');
        return;
      }

      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          privacy_level: formData.privacy_level,
          owner_id: user.id
        })
        .select()
        .single();

      if (insertError) {
        console.error('Project creation error:', insertError);
        setError('Failed to create project. Please try again.');
        return;
      }

      // Log GDPR action
      try {
        await supabase.rpc('log_gdpr_action', {
          p_user_id: user.id,
          p_action: 'project_created',
          p_details: { 
            project_id: data.id,
            project_name: formData.name,
            privacy_level: formData.privacy_level
          },
          p_ip_address: null,
          p_user_agent: navigator.userAgent,
        });
      } catch (logError) {
        console.warn('Failed to log GDPR action:', logError);
      }

      // Reset form and close dialog
      setFormData({ name: '', description: '', privacy_level: 'private' });
      onProjectCreated();
      onClose();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', description: '', privacy_level: 'private' });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {error && (
              <Alert severity="error">{error}</Alert>
            )}
            
            <TextField
              fullWidth
              label="Project Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={loading}
              placeholder="Optional project description..."
            />
            
            <FormControl fullWidth>
              <InputLabel>Privacy Level</InputLabel>
              <Select
                value={formData.privacy_level}
                onChange={(e) => handleInputChange('privacy_level', e.target.value)}
                label="Privacy Level"
                disabled={loading}
              >
                <MenuItem value="private">Private - Only you and invited members</MenuItem>
                <MenuItem value="team">Team - Visible to team members</MenuItem>
                <MenuItem value="public">Public - Visible to everyone</MenuItem>
              </Select>
            </FormControl>
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
            type="submit" 
            variant="contained" 
            disabled={loading || !formData.name.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}