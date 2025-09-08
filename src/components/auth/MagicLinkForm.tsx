'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the magic link!');
        
        // Log the login attempt for GDPR compliance
        try {
          await supabase.rpc('log_gdpr_action', {
            p_user_id: null, // Will be set when user is authenticated
            p_action: 'login_attempted',
            p_details: { email },
            p_ip_address: null, // Could be captured if needed
            p_user_agent: navigator.userAgent,
          });
        } catch (logError) {
          console.warn('Failed to log GDPR action:', logError);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Magic link error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        py: 4,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Email color="primary" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your email to receive a secure magic link
            </Typography>
          </Box>

          {message && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              sx={{ mb: 3 }}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mb: 3, py: 1.5 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Sending Magic Link...
                </>
              ) : (
                'Send Magic Link'
              )}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Button
              component={Link}
              href="/"
              startIcon={<ArrowBack />}
              variant="text"
              size="small"
            >
              Back to Home
            </Button>
          </Box>

          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              By signing in, you agree to our{' '}
              <MuiLink component={Link} href="/privacy/policy" underline="hover">
                Privacy Policy
              </MuiLink>{' '}
              and{' '}
              <MuiLink component={Link} href="/privacy/terms" underline="hover">
                Terms of Service
              </MuiLink>
              .
            </Typography>
            <Typography variant="caption" color="text.secondary">
              🔒 We use passwordless authentication for enhanced security.
              No passwords are stored or transmitted.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}