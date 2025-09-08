'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search,
  Person,
  AdminPanelSettings,
  MoreVert,
  Email,
  CalendarToday,
  Security,
  Delete,
  Edit,
  Block,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  total_projects: number;
  owned_projects: number;
  shared_projects: number;
  display_name?: string;
  is_current_user: boolean;
}

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [userDetailDialog, setUserDetailDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadUsers();
    }
  }, [user, authLoading]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');

      // Get owned projects
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select('id, owner_id')
        .eq('owner_id', user!.id);

      if (ownedError) {
        console.error('Owned projects fetch error:', ownedError);
        setError('Failed to load user data');
        return;
      }

      // Get member projects  
      const { data: membershipData, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id, user_id, role, projects(id, owner_id)')
        .eq('user_id', user!.id);

      // Get all project members for projects user has access to
      const accessibleProjectIds = new Set();
      (ownedProjects || []).forEach(p => accessibleProjectIds.add(p.id));
      if (membershipData && !membershipError) {
        membershipData.forEach(m => {
          if (m.projects) {
            accessibleProjectIds.add(m.projects.id);
          }
        });
      }

      // Get all members from accessible projects
      const { data: allMembersData, error: allMembersError } = await supabase
        .from('project_members')
        .select('user_id, role, project_id')
        .in('project_id', Array.from(accessibleProjectIds));

      if (allMembersError) {
        console.error('Members fetch error:', allMembersError);
      }

      // Combine project data
      const projectsData = [
        ...(ownedProjects || []),
        ...(membershipData?.map(m => m.projects).filter(Boolean) || [])
      ].filter((p, index, arr) => arr.findIndex(x => x?.id === p?.id) === index);

      // Collect all unique user IDs
      const userIds = new Set<string>();
      userIds.add(user!.id); // Add current user

      projectsData?.forEach(project => {
        userIds.add(project.owner_id);
      });
      
      // Add members from all accessible projects
      if (allMembersData) {
        allMembersData.forEach(member => {
          userIds.add(member.user_id);
        });
      }

      // Get user preferences for display names
      const { data: preferencesData } = await supabase
        .from('user_preferences')
        .select('user_id, display_name')
        .in('user_id', Array.from(userIds));

      // Build user data (in a real app, you'd get this from auth.users via admin API)
      const usersData: UserData[] = Array.from(userIds).map(userId => {
        const preferences = preferencesData?.find(p => p.user_id === userId);
        const ownedProjects = projectsData?.filter(p => p.owner_id === userId).length || 0;
        const memberProjects = allMembersData?.filter(m => m.user_id === userId).length || 0;

        return {
          id: userId,
          email: userId === user!.id ? user!.email : `user-${userId.substring(0, 8)}@example.com`,
          created_at: userId === user!.id ? user!.created_at : new Date().toISOString(),
          email_confirmed_at: userId === user!.id ? user!.email_confirmed_at : new Date().toISOString(),
          last_sign_in_at: userId === user!.id ? user!.last_sign_in_at : null,
          total_projects: ownedProjects + memberProjects,
          owned_projects: ownedProjects,
          shared_projects: memberProjects,
          display_name: preferences?.display_name || null,
          is_current_user: userId === user!.id
        };
      });

      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>, userData: UserData) => {
    setMenuAnchor(event.currentTarget);
    setSelectedUser(userData);
  };

  const handleUserMenuClose = () => {
    setMenuAnchor(null);
    setSelectedUser(null);
  };

  const handleViewUser = () => {
    if (selectedUser) {
      setUserDetailDialog(true);
    }
    handleUserMenuClose();
  };

  const filteredUsers = users.filter(userData =>
    userData.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (userData.display_name && userData.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (authLoading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users and their access across your projects
        </Typography>
      </Box>

      {/* Search and Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {users.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Users
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Users Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Projects</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Last Active</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((userData) => (
                    <TableRow key={userData.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar>
                            {userData.is_current_user ? (
                              <AdminPanelSettings />
                            ) : (
                              <Person />
                            )}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {userData.display_name || userData.email}
                              {userData.is_current_user && ' (You)'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {userData.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Chip
                            icon={<CheckCircle />}
                            label={userData.email_confirmed_at ? 'Verified' : 'Pending'}
                            color={userData.email_confirmed_at ? 'success' : 'warning'}
                            size="small"
                          />
                          {userData.is_current_user && (
                            <Chip label="Admin" color="primary" size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {userData.total_projects} total
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {userData.owned_projects} owned • {userData.shared_projects} shared
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(userData.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(userData.last_sign_in_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleUserMenuOpen(e, userData)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredUsers.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No users found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery ? 'Try adjusting your search terms' : 'No users to display'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={handleViewUser}>
          <Person sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        {!selectedUser?.is_current_user && (
          <>
            <MenuItem onClick={handleUserMenuClose}>
              <Email sx={{ mr: 1 }} fontSize="small" />
              Send Message
            </MenuItem>
            <MenuItem onClick={handleUserMenuClose}>
              <Block sx={{ mr: 1 }} fontSize="small" />
              Manage Access
            </MenuItem>
          </>
        )}
      </Menu>

      {/* User Detail Dialog */}
      <Dialog
        open={userDetailDialog}
        onClose={() => setUserDetailDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar>
                  {selectedUser.is_current_user ? <AdminPanelSettings /> : <Person />}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedUser.display_name || selectedUser.email}
                    {selectedUser.is_current_user && ' (You)'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUser.email}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {selectedUser.id.substring(0, 8)}...
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedUser.email_confirmed_at ? 'Verified' : 'Pending'}
                    color={selectedUser.email_confirmed_at ? 'success' : 'warning'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Projects
                  </Typography>
                  <Typography variant="body2">
                    {selectedUser.total_projects}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Owned Projects
                  </Typography>
                  <Typography variant="body2">
                    {selectedUser.owned_projects}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Joined Date
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedUser.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Active
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedUser.last_sign_in_at)}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setUserDetailDialog(false)}>
                Close
              </Button>
              {!selectedUser.is_current_user && (
                <Button variant="contained">
                  Manage Access
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}