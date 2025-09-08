'use client';

import { useAuth, signOut } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Grid,
} from '@mui/material';
import { 
  ExitToApp, 
  AccountCircle, 
  Dashboard as DashboardIcon,
  FolderOpen,
  People,
  Settings,
  Add,
  TrendingUp,
  Assignment
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6">Loading your dashboard...</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please wait while we load your data
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Container sx={{ py: 2 }}>
        <Alert severity="error">
          Authentication required. Please sign in to access your dashboard.
        </Alert>
      </Container>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <DashboardContent user={user} onSignOut={handleSignOut} />
    </Container>
  );
}

// Dashboard content component
function DashboardContent({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProjects: 0,
    ownedProjects: 0,
    sharedProjects: 0,
    totalMembers: 0
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get owned projects
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select('id, name, description, privacy_level, created_at, updated_at, owner_id')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (ownedError) {
        console.error('Owned projects fetch error:', ownedError);
        return;
      }

      // Get member projects
      const { data: membershipData, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id, role, projects(id, name, description, privacy_level, created_at, updated_at, owner_id)')
        .eq('user_id', user.id);

      // Combine all projects
      const allProjects = [...(ownedProjects || [])];
      if (membershipData && !membershipError) {
        membershipData.forEach(membership => {
          if (membership.projects && !allProjects.find(p => p.id === membership.projects.id)) {
            allProjects.push(membership.projects);
          }
        });
      }

      const projectsData = allProjects.slice(0, 5);

      const projects = projectsData || [];
      const ownedProjectsList = projects.filter(p => p.owner_id === user.id);
      const sharedProjectsList = projects.filter(p => p.owner_id !== user.id);
      
      // Calculate total members across all projects
      let totalMembers = 0;
      for (const project of projects) {
        const { count } = await supabase
          .from('project_members')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id);
        totalMembers += (count || 0) + 1; // +1 for owner
      }

      setStats({
        totalProjects: projects.length,
        ownedProjects: ownedProjectsList.length,
        sharedProjects: sharedProjectsList.length,
        totalMembers
      });

      setRecentProjects(projects.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h3" component="h1">
            Dashboard
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ExitToApp />}
            onClick={onSignOut}
          >
            Sign Out
          </Button>
        </Stack>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome to your project management dashboard
        </Typography>
      </Box>

      {/* User Info Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <AccountCircle fontSize="large" color="primary" />
            <Box>
              <Typography variant="h5" gutterBottom>
                Welcome back!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip 
              label={`User ID: ${user.id.substring(0, 8)}...`} 
              variant="outlined" 
              size="small" 
            />
            <Chip 
              label={user.email_confirmed_at ? 'Email Verified' : 'Email Pending'} 
              color={user.email_confirmed_at ? 'success' : 'warning'}
              size="small" 
            />
            <Chip 
              label={`Joined: ${new Date(user.created_at).toLocaleDateString()}`} 
              variant="outlined" 
              size="small" 
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => router.push('/dashboard/projects')}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <FolderOpen color="primary" />
                  <Box>
                    <Typography variant="h4">{stats.totalProjects}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Projects</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <People color="primary" />
                  <Box>
                    <Typography variant="h4">{stats.totalMembers}</Typography>
                    <Typography variant="body2" color="text.secondary">Team Members</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Assignment color="primary" />
                  <Box>
                    <Typography variant="h4">{stats.ownedProjects}</Typography>
                    <Typography variant="body2" color="text.secondary">Owned Projects</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TrendingUp color="primary" />
                  <Box>
                    <Typography variant="h4">{stats.sharedProjects}</Typography>
                    <Typography variant="body2" color="text.secondary">Shared Projects</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recent Projects */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h5">Recent Projects</Typography>
            <Stack direction="row" spacing={1}>
              <Button 
                startIcon={<Add />} 
                variant="outlined" 
                size="small"
                onClick={() => router.push('/dashboard/projects')}
              >
                New Project
              </Button>
              <Button 
                variant="text" 
                size="small"
                onClick={() => router.push('/dashboard/projects')}
              >
                View All
              </Button>
            </Stack>
          </Stack>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          ) : recentProjects.length > 0 ? (
            <Stack spacing={2}>
              {recentProjects.map((project) => (
                <Box
                  key={project.id}
                  sx={{
                    p: 3,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'grey.50' }
                  }}
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">{project.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {project.description || 'No description'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Stack direction="column" alignItems="flex-end" spacing={1}>
                      <Chip
                        label={project.privacy_level}
                        size="small"
                        color={
                          project.privacy_level === 'public' ? 'success' :
                          project.privacy_level === 'team' ? 'info' : 'default'
                        }
                        variant="outlined"
                      />
                      {project.owner_id === user.id && (
                        <Chip label="Owner" color="primary" size="small" />
                      )}
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <FolderOpen sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No projects yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first project to get started with collaboration
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => router.push('/dashboard/projects')}
              >
                Create Your First Project
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <DashboardIcon fontSize="large" color="primary" />
            <Typography variant="h5">
              Coming Soon
            </Typography>
          </Stack>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your complete project management platform is being built! Here's what's coming:
          </Typography>
          
          <Grid container spacing={2}>
            {[
              '📁 Full Project Management',
              '👥 Team Collaboration Tools',
              '📊 Advanced Analytics',
              '🔒 GDPR Data Controls',
              '📈 Progress Tracking',
              '⚙️ Custom Workflows'
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2">
                    {feature}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </>
  );
}