'use client';

import { useAuth, signOut } from '@/hooks/useAuth';
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
  Add
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

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
      <Container sx={{ py: 4 }}>
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <DashboardContent user={user} onSignOut={handleSignOut} />
    </Container>
  );
}

// Dashboard content component
function DashboardContent({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  const mockProjects = [
    { id: 1, name: 'Website Redesign', members: 4, updated: '2 hours ago', status: 'Active' },
    { id: 2, name: 'Mobile App', members: 2, updated: '1 day ago', status: 'Planning' },
    { id: 3, name: 'Marketing Campaign', members: 6, updated: '3 days ago', status: 'Review' },
  ];

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
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <FolderOpen color="primary" />
                <Box>
                  <Typography variant="h4">3</Typography>
                  <Typography variant="body2" color="text.secondary">Projects</Typography>
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
                  <Typography variant="h4">12</Typography>
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
                <DashboardIcon color="primary" />
                <Box>
                  <Typography variant="h4">7</Typography>
                  <Typography variant="body2" color="text.secondary">Active Tasks</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Settings color="primary" />
                <Box>
                  <Typography variant="h4">2</Typography>
                  <Typography variant="body2" color="text.secondary">Notifications</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Projects */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h5">Recent Projects</Typography>
            <Button startIcon={<Add />} variant="outlined" size="small">
              New Project
            </Button>
          </Stack>
          
          <Stack spacing={2}>
            {mockProjects.map((project) => (
              <Box
                key={project.id}
                sx={{
                  p: 3,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'grey.50' }
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">{project.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {project.members} members • Updated {project.updated}
                    </Typography>
                  </Box>
                  <Chip
                    label={project.status}
                    size="small"
                    color={project.status === 'Active' ? 'success' : 'default'}
                  />
                </Stack>
              </Box>
            ))}
          </Stack>
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