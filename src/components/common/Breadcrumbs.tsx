'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Breadcrumbs as MUIBreadcrumbs,
  Link,
  Typography,
  Box
} from '@mui/material';
import {
  Home,
  Dashboard as DashboardIcon,
  FolderOpen,
  People,
  Settings,
} from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    if (pathname === '/') {
      return [{ label: 'Home', icon: <Home fontSize="small" /> }];
    }

    // Always start with dashboard for dashboard pages
    if (pathname.startsWith('/dashboard')) {
      breadcrumbs.push({
        label: 'Dashboard',
        href: '/dashboard',
        icon: <DashboardIcon fontSize="small" />
      });

      if (pathSegments.length > 1) {
        const section = pathSegments[1];
        
        switch (section) {
          case 'projects':
            breadcrumbs.push({
              label: 'Projects',
              href: '/dashboard/projects',
              icon: <FolderOpen fontSize="small" />
            });
            
            // If viewing specific project
            if (pathSegments.length > 2) {
              breadcrumbs.push({
                label: 'Project Details',
                icon: <FolderOpen fontSize="small" />
              });
            }
            break;
            
          case 'users':
            breadcrumbs.push({
              label: 'Users',
              icon: <People fontSize="small" />
            });
            break;
            
          case 'settings':
            breadcrumbs.push({
              label: 'Settings',
              icon: <Settings fontSize="small" />
            });
            break;
        }
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <MUIBreadcrumbs
        aria-label="breadcrumb"
        separator="›"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            mx: 1
          }
        }}
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          if (isLast) {
            return (
              <Typography 
                key={index}
                color="text.primary"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  fontWeight: 'medium'
                }}
              >
                {crumb.icon}
                {crumb.label}
              </Typography>
            );
          }

          return (
            <Link
              key={index}
              underline="hover"
              color="inherit"
              href={crumb.href}
              onClick={(e) => {
                if (crumb.href) {
                  e.preventDefault();
                  router.push(crumb.href);
                }
              }}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                cursor: 'pointer'
              }}
            >
              {crumb.icon}
              {crumb.label}
            </Link>
          );
        })}
      </MUIBreadcrumbs>
    </Box>
  );
}