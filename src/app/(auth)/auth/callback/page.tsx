'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Authentication failed. Please try signing in again.');
          return;
        }

        if (session?.user) {
          // Log successful authentication for GDPR compliance
          try {
            await supabase.rpc('log_gdpr_action', {
              p_user_id: session.user.id,
              p_action: 'account_created',
              p_details: { 
                email: session.user.email,
                provider: 'magic_link',
                confirmed_at: session.user.email_confirmed_at
              },
              p_ip_address: null,
              p_user_agent: navigator.userAgent,
            });

            // Create user preferences record if it doesn't exist
            const { error: prefsError } = await supabase
              .from('user_preferences')
              .upsert({
                user_id: session.user.id,
                data_processing_consent: true, // Required for service to function
                consent_date: new Date().toISOString(),
              }, {
                onConflict: 'user_id'
              });

            if (prefsError) {
              console.warn('Failed to create user preferences:', prefsError);
            }
          } catch (logError) {
            console.warn('Failed to log authentication:', logError);
          }

          // Redirect to dashboard
          router.push('/dashboard');
        } else {
          setError('No session found. Please try signing in again.');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An unexpected error occurred. Please try signing in again.');
      }
    };

    handleAuthCallback();
  }, [router]);

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <CircularProgress size={60} sx={{ mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Signing you in...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we verify your authentication
      </Typography>
    </Box>
  );
}