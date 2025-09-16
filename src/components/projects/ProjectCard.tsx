'use client';

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  FolderOpen,
  People,
  MoreVert,
  Edit,
  Delete,
  Share,
  Lock,
  Group,
  Public
} from '@mui/icons-material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';

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

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onShare?: (project: Project) => void;
}

export default function ProjectCard({ project, onEdit, onDelete, onShare }: ProjectCardProps) {
  const router = useRouter();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Get project permissions based on ownership and user role
  const permissions = useProjectPermissions(
    project.owner_id,
    project.is_owner ? undefined : (project.role === 'owner' ? undefined : project.role)
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleViewProject = () => {
    router.push(`/dashboard/projects/${project.id}`);
  };

  const getPrivacyIcon = () => {
    switch (project.privacy_level) {
      case 'private':
        return <Lock fontSize="small" />;
      case 'team':
        return <Group fontSize="small" />;
      case 'public':
        return <Public fontSize="small" />;
      default:
        return <Lock fontSize="small" />;
    }
  };

  const getPrivacyColor = () => {
    switch (project.privacy_level) {
      case 'private':
        return 'default';
      case 'team':
        return 'info';
      case 'public':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'medium' }}>
            {project.name}
          </Typography>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ ml: 1 }}
          >
            <MoreVert />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            icon={getPrivacyIcon()}
            label={project.privacy_level}
            size="small"
            color={getPrivacyColor()}
            variant="outlined"
          />
          {project.is_owner && (
            <Chip
              label="Owner"
              size="small"
              color="primary"
              variant="filled"
            />
          )}
        </Box>

        {project.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {project.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <People fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {project.member_count} member{project.member_count !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Updated {formatDate(project.updated_at)}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          startIcon={<FolderOpen />}
          onClick={handleViewProject}
          variant="contained"
          fullWidth
        >
          Open Project
        </Button>
      </CardActions>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {permissions.canEdit && onEdit && (
          <MenuItem onClick={() => { onEdit(project); handleMenuClose(); }}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit Project
          </MenuItem>
        )}
        {onShare && (
          <MenuItem onClick={() => { onShare(project); handleMenuClose(); }}>
            <Share fontSize="small" sx={{ mr: 1 }} />
            Share Project
          </MenuItem>
        )}
        {permissions.canDelete && onDelete && (
          <MenuItem 
            onClick={() => { onDelete(project); handleMenuClose(); }}
            sx={{ color: 'error.main' }}
          >
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete Project
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}