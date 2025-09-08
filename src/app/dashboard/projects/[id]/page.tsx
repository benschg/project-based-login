'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Chip,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Share,
  People,
  Settings,
  MoreVert,
  Lock,
  Group,
  Public,
  Person,
  AdminPanelSettings,
  Delete
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import InviteMembersDialog from '@/components/projects/InviteMembersDialog';
import PendingInvitations from '@/components/projects/PendingInvitations';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';

interface ProjectMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user_email?: string;
  user_display_name?: string;
}

interface ProjectDetails {
  id: string;
  name: string;
  description: string | null;
  privacy_level: 'private' | 'team' | 'public';
  created_at: string;
  updated_at: string;
  owner_id: string;
  is_owner: boolean;
  members: ProjectMember[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'member' | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [memberMenuAnchor, setMemberMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const projectId = params?.id as string;
  
  // Get project permissions based on ownership and user role
  const permissions = useProjectPermissions(
    project?.owner_id || '', 
    project?.is_owner ? undefined : userRole
  );

  const loadProject = async () => {
    if (!user || !projectId) return;

    try {
      setLoading(true);
      setError('');

      // Get project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Project fetch error:', projectError);
        setError('Project not found');
        return;
      }

      // Check if user has access to this project
      const isOwner = projectData.owner_id === user.id;
      let hasAccess = isOwner;

      if (!isOwner) {
        const { data: memberData } = await supabase
          .from('project_members')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .single();

        hasAccess = !!memberData;
        if (memberData) {
          setUserRole(memberData.role);
        }
      }

      if (!hasAccess) {
        setError('You do not have access to this project');
        return;
      }

      // Get project members with user details
      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select(`
          id,
          user_id,
          role,
          joined_at
        `)
        .eq('project_id', projectId);

      if (membersError) {
        console.error('Members fetch error:', membersError);
      }

      // Get user details for members (from auth.users via RPC or by getting user emails)
      const membersWithDetails: ProjectMember[] = [];
      
      if (membersData) {
        for (const member of membersData) {
          // In a real app, you'd want to get user details
          // For now, we'll use placeholder data
          membersWithDetails.push({
            ...member,
            user_email: `user-${member.user_id.substring(0, 8)}@example.com`,
            user_display_name: `User ${member.user_id.substring(0, 8)}`
          });
        }
      }

      setProject({
        ...projectData,
        is_owner: isOwner,
        members: membersWithDetails
      });

    } catch (err) {
      console.error('Unexpected error loading project:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadProject();
    }
  }, [user, authLoading, projectId]);

  const handleMemberMenuOpen = (event: React.MouseEvent<HTMLElement>, member: ProjectMember) => {
    setMemberMenuAnchor(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMemberMenuClose = () => {
    setMemberMenuAnchor(null);
    setSelectedMember(null);
  };

  const handleMembersInvited = () => {
    loadProject(); // Refresh project data after members are invited
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      console.log('Removing member with ID:', selectedMember.id);
      
      const { error, count } = await supabase
        .from('project_members')
        .delete()
        .eq('id', selectedMember.id);

      if (error) {
        console.error('Error removing member:', error);
        return;
      }

      console.log('Deleted rows count:', count);
      
      // Also remove any related invitations if they exist
      await supabase
        .from('project_invitations')
        .delete()
        .eq('project_id', projectId)
        .eq('accepted_by', selectedMember.user_id);

      // Log GDPR action
      try {
        await supabase.rpc('log_gdpr_action', {
          p_user_id: user!.id,
          p_action: 'member_removed',
          p_details: { 
            project_id: projectId,
            removed_user_id: selectedMember.user_id,
            removed_user_email: selectedMember.user_email
          },
          p_ip_address: null,
          p_user_agent: navigator.userAgent,
        });
      } catch (logError) {
        console.warn('Failed to log GDPR action:', logError);
      }

      // Force refresh the project data
      await loadProject(); // Refresh project data
      console.log('Project data refreshed after member removal');
    } catch (err) {
      console.error('Error removing member:', err);
    }
    handleMemberMenuClose();
  };

  const handleChangeRole = async (newRole: 'admin' | 'member') => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from('project_members')
        .update({ role: newRole })
        .eq('id', selectedMember.id);

      if (error) {
        console.error('Error updating member role:', error);
        return;
      }

      // Log GDPR action
      try {
        await supabase.rpc('log_gdpr_action', {
          p_user_id: user!.id,
          p_action: 'member_role_changed',
          p_details: { 
            project_id: projectId,
            target_user_id: selectedMember.user_id,
            old_role: selectedMember.role,
            new_role: newRole
          },
          p_ip_address: null,
          p_user_agent: navigator.userAgent,
        });
      } catch (logError) {
        console.warn('Failed to log GDPR action:', logError);
      }

      loadProject(); // Refresh project data
    } catch (err) {
      console.error('Error updating member role:', err);
    }
    handleMemberMenuClose();
  };

  const getPrivacyIcon = () => {
    if (!project) return <Lock />;
    switch (project.privacy_level) {
      case 'private': return <Lock />;
      case 'team': return <Group />;
      case 'public': return <Public />;
      default: return <Lock />;
    }
  };

  const getPrivacyColor = () => {
    if (!project) return 'default';
    switch (project.privacy_level) {
      case 'private': return 'default';
      case 'team': return 'info';
      case 'public': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/dashboard/projects')}
        >
          Back to Projects
        </Button>
      </Container>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/dashboard/projects')}
          sx={{ mb: 2 }}
        >
          Back to Projects
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h4" component="h1">
                {project.name}
              </Typography>
              <Chip
                icon={getPrivacyIcon()}
                label={project.privacy_level}
                color={getPrivacyColor()}
                variant="outlined"
              />
              {project.is_owner && (
                <Chip label="Owner" color="primary" variant="filled" />
              )}
            </Box>
            
            {project.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {project.description}
              </Typography>
            )}

            <Typography variant="body2" color="text.secondary">
              Created {formatDate(project.created_at)}
              {project.updated_at !== project.created_at && (
                <> • Updated {formatDate(project.updated_at)}</>
              )}
            </Typography>
          </Box>

          {(permissions.canEdit || permissions.canInviteMembers) && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {permissions.canEdit && (
                <Button startIcon={<Edit />} variant="outlined">
                  Edit
                </Button>
              )}
              <Button startIcon={<Share />} variant="outlined">
                Share
              </Button>
              {project.is_owner && (
                <Button startIcon={<Settings />} variant="outlined">
                  Settings
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label={`Members (${project.members.length + 1})`} />
          <Tab label="Activity" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Project Stats */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Project Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {project.members.length + 1}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Members
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tasks
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Files
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Comments
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No recent activity in this project.
              </Typography>
            </Paper>
          </Grid>

          {/* Project Details */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Project Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Privacy Level
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  {getPrivacyIcon()}
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {project.privacy_level}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {formatDate(project.created_at)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {formatDate(project.updated_at)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Project Members
                </Typography>
                {permissions.canInviteMembers && (
                  <Button 
                    variant="contained" 
                    startIcon={<Person />}
                    onClick={() => setInviteDialogOpen(true)}
                  >
                    Invite Members
                  </Button>
                )}
              </Box>

              {/* Owner - only show if current user is the actual owner */}
              {project.is_owner && (
                <Card sx={{ mb: 2 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <AdminPanelSettings />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          You (Project Owner)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip label="Owner" color="primary" />
                  </CardContent>
                </Card>
              )}

              {/* Pending Invitations */}
              {project.is_owner && (
                <PendingInvitations 
                  projectId={projectId} 
                  onInvitationRevoked={handleMembersInvited}
                />
              )}

              {/* All Project Members (including owner if they appear in members list) */}
              {project.members.map((member) => (
                <Card key={member.id} sx={{ mb: 1 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          {member.user_display_name || 'Unknown User'}
                          {member.user_id === user.id && ' (You)'}
                          {member.user_id === project.owner_id && member.user_id !== user.id && ' (Project Owner)'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {member.user_email || 'No email available'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Joined {formatDate(member.joined_at)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={member.role} 
                        color={
                          member.role === 'owner' ? 'primary' :
                          member.role === 'admin' ? 'secondary' : 'default'
                        }
                        size="small"
                      />
                      {(permissions.canRemoveMembers || permissions.canChangeRoles) && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMemberMenuOpen(e, member)}
                        >
                          <MoreVert />
                        </IconButton>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {project.members.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No additional members
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Invite team members to collaborate on this project
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Activity feed feature coming soon...
          </Typography>
        </Paper>
      )}

      {/* Member Actions Menu */}
      <Menu
        anchorEl={memberMenuAnchor}
        open={Boolean(memberMenuAnchor)}
        onClose={handleMemberMenuClose}
      >
        {permissions.canChangeRoles && (
          selectedMember?.role === 'member' ? (
            <MenuItem onClick={() => handleChangeRole('admin')}>
              <AdminPanelSettings sx={{ mr: 1 }} fontSize="small" />
              Make Admin
            </MenuItem>
          ) : (
            <MenuItem onClick={() => handleChangeRole('member')}>
              <Person sx={{ mr: 1 }} fontSize="small" />
              Make Member
            </MenuItem>
          )
        )}
        {permissions.canRemoveMembers && (
          <MenuItem onClick={handleRemoveMember} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} fontSize="small" />
            Remove Member
          </MenuItem>
        )}
      </Menu>

      {/* Invite Members Dialog */}
      <InviteMembersDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        projectId={projectId}
        projectName={project.name}
        onMembersInvited={handleMembersInvited}
      />
    </Container>
  );
}