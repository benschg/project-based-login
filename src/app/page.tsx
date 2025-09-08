'use client';

import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  Stack
} from '@mui/material';
import { 
  Security, 
  Group, 
  Dashboard,
  Privacy
} from '@mui/icons-material';

export default function HomePage() {
  const features = [
    {
      icon: <Security fontSize="large" color="primary" />,
      title: 'Passwordless Authentication',
      description: 'Secure magic link login with no passwords to remember'
    },
    {
      icon: <Group fontSize="large" color="primary" />,
      title: 'Project Collaboration',
      description: 'Share projects with team members and manage permissions'
    },
    {
      icon: <Dashboard fontSize="large" color="primary" />,
      title: 'User Management',
      description: 'Complete admin panel for user and project management'
    },
    {
      icon: <Privacy fontSize="large" color="primary" />,
      title: 'GDPR Compliant',
      description: 'Built with privacy by design and full GDPR compliance'
    }
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box
        sx={{
          py: 12,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          Project-Based Collaboration Platform
        </Typography>
        <Typography
          variant="h5"
          component="p"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}
        >
          Secure, privacy-first platform for managing projects with team collaboration.
          Passwordless authentication and GDPR compliance built-in.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button 
            variant="contained" 
            size="large"
            href="/login"
            sx={{ px: 4, py: 1.5 }}
          >
            Get Started
          </Button>
          <Button 
            variant="outlined" 
            size="large"
            href="/privacy/policy"
            sx={{ px: 4, py: 1.5 }}
          >
            Privacy Policy
          </Button>
        </Stack>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          gutterBottom
          sx={{ mb: 6 }}
        >
          Key Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {feature.icon}
                    <Typography
                      variant="h5"
                      component="h3"
                      sx={{ ml: 2, fontWeight: 'medium' }}
                    >
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 6,
          mt: 8,
          borderTop: 1,
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Built with privacy by design. Your data remains yours.
        </Typography>
      </Box>
    </Container>
  );
}