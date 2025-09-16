'use client';

import { Container, Typography, Paper, Box, Link, Divider } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Privacy Policy
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Information We Collect
          </Typography>
          <Typography paragraph>
            We collect minimal information necessary for the functioning of our service:
          </Typography>
          <Typography component="ul" paragraph>
            <li>Email address (for authentication)</li>
            <li>Optional display name</li>
            <li>Project data you create</li>
            <li>Usage preferences (theme, language)</li>
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            2. How We Use Your Information
          </Typography>
          <Typography paragraph>
            Your information is used solely for:
          </Typography>
          <Typography component="ul" paragraph>
            <li>Authentication and account management</li>
            <li>Providing project management services</li>
            <li>Sending service-related emails (with your consent)</li>
            <li>Improving user experience</li>
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            3. Data Storage and Security
          </Typography>
          <Typography paragraph>
            We implement industry-standard security measures:
          </Typography>
          <Typography component="ul" paragraph>
            <li>Encrypted data transmission (HTTPS)</li>
            <li>Secure database storage with Supabase</li>
            <li>Passwordless authentication for enhanced security</li>
            <li>Regular security audits</li>
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            4. GDPR Compliance
          </Typography>
          <Typography paragraph>
            We respect your rights under GDPR:
          </Typography>
          <Typography component="ul" paragraph>
            <li><strong>Right to Access:</strong> Export your data at any time</li>
            <li><strong>Right to Rectification:</strong> Edit your profile information</li>
            <li><strong>Right to Erasure:</strong> Delete your account and all associated data</li>
            <li><strong>Right to Portability:</strong> Export data in JSON format</li>
            <li><strong>Right to Object:</strong> Manage consent preferences</li>
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            5. Data Sharing
          </Typography>
          <Typography paragraph>
            We do not sell, rent, or share your personal information with third parties except:
          </Typography>
          <Typography component="ul" paragraph>
            <li>When required by law</li>
            <li>To protect our rights and safety</li>
            <li>With your explicit consent</li>
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            6. Cookies
          </Typography>
          <Typography paragraph>
            We use minimal essential cookies for:
          </Typography>
          <Typography component="ul" paragraph>
            <li>Authentication sessions</li>
            <li>User preferences (theme, language)</li>
            <li>Security purposes</li>
          </Typography>
          <Typography paragraph>
            No tracking or advertising cookies are used.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            7. Data Retention
          </Typography>
          <Typography paragraph>
            We retain your data only as long as necessary:
          </Typography>
          <Typography component="ul" paragraph>
            <li>Active account data: Until account deletion</li>
            <li>Deleted account data: Removed within 30 days</li>
            <li>Audit logs: Retained for 90 days for security</li>
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            8. Children's Privacy
          </Typography>
          <Typography paragraph>
            Our service is not intended for users under 16 years of age. We do not knowingly
            collect information from children under 16.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            9. Changes to This Policy
          </Typography>
          <Typography paragraph>
            We may update this privacy policy from time to time. We will notify you of any
            material changes via email or through the service.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            10. Contact Us
          </Typography>
          <Typography paragraph>
            For privacy-related inquiries or to exercise your GDPR rights, contact us at:
          </Typography>
          <Typography paragraph>
            Email: {process.env.NEXT_PUBLIC_PRIVACY_EMAIL || 'privacy@example.com'}
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Link
            component="button"
            onClick={() => router.push('/')}
            underline="hover"
          >
            Return to Home
          </Link>
          <Link
            component="button"
            onClick={() => router.push('/terms')}
            underline="hover"
          >
            Terms of Service
          </Link>
        </Box>
      </Paper>
    </Container>
  );
}