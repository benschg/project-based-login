'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  Add,
  Search,
  FolderOpen,
  People,
  Lock,
  Group,
  Public
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import CreateProjectDialog from '@/components/projects/CreateProjectDialog';
import ProjectCard from '@/components/projects/ProjectCard';

interface Project {
  id: string;
  name: string;
  description: string | null;
  privacy_level: 'private' | 'team' | 'public';
  created_at: string;
  updated_at: string;
  owner_id: string;
  is_owner: boolean;
  member_count: number;
  role?: 'owner' | 'admin' | 'member';
}

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const loadProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const { projects: projectSummaries } = await response.json();
      
      // Transform to match the existing interface
      const transformedProjects: Project[] = projectSummaries.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        privacy_level: project.privacyLevel,
        created_at: new Date(project.createdAt).toISOString(),
        updated_at: new Date(project.updatedAt).toISOString(),
        owner_id: project.ownerId,
        is_owner: project.isOwner,
        member_count: project.memberCount,
        role: project.role
      }));

      setProjects(transformedProjects);
    } catch (err) {
      console.error('Unexpected error loading projects:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadProjects();
    }
  }, [user, authLoading]);

  const handleProjectCreated = () => {
    loadProjects();
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === 0) return matchesSearch; // All projects
    if (activeTab === 1) return matchesSearch && project.is_owner; // My projects
    if (activeTab === 2) return matchesSearch && !project.is_owner; // Shared with me
    
    return matchesSearch;
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            My Projects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and collaborate on your projects
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          size="large"
        >
          New Project
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab 
            label={`All Projects (${projects.length})`} 
            icon={<FolderOpen />} 
            iconPosition="start"
          />
          <Tab 
            label={`My Projects (${projects.filter(p => p.is_owner).length})`}
            icon={<People />} 
            iconPosition="start"
          />
          <Tab 
            label={`Shared (${projects.filter(p => !p.is_owner).length})`}
            icon={<Group />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats Summary */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
            <Chip 
              icon={<FolderOpen />} 
              label={`${projects.length} Total Projects`}
              variant="outlined"
            />
            <Chip 
              icon={<Lock />} 
              label={`${projects.filter(p => p.privacy_level === 'private').length} Private`}
              color="default"
              variant="outlined"
            />
            <Chip 
              icon={<Group />} 
              label={`${projects.filter(p => p.privacy_level === 'team').length} Team`}
              color="info"
              variant="outlined"
            />
            <Chip 
              icon={<Public />} 
              label={`${projects.filter(p => p.privacy_level === 'public').length} Public`}
              color="success"
              variant="outlined"
            />
          </Box>

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <FolderOpen sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchQuery ? 'No projects match your search' : 'No projects yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Create your first project to get started'
                }
              </Typography>
              {!searchQuery && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Your First Project
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredProjects.map((project) => (
                <Grid item xs={12} sm={6} lg={4} key={project.id}>
                  <ProjectCard
                    project={project}
                    onEdit={() => {/* TODO: Implement edit */}}
                    onDelete={() => {/* TODO: Implement delete */}}
                    onShare={() => {/* TODO: Implement share */}}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </Container>
  );
}