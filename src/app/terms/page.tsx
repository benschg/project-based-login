'use client';

import { Container, Typography, Paper, Box, Link, Divider } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function TermsOfService() {
  const router = useRouter();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Terms of Service
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Acceptance of Terms
          </Typography>
          <Typography paragraph>
            By accessing and using this service, you accept and agree to be bound by the terms
            and provision of this agreement. If you do not agree to abide by the above, please
            do not use this service.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            2. Service Description
          </Typography>
          <Typography paragraph>
            Our service provides project management tools with the following features:
          </Typography>
          <Typography component="ul" paragraph>
            <li>Project creation and management</li>
            <li>Team collaboration capabilities</li>
            <li>Member invitation and role management</li>
            <li>Secure passwordless authentication</li>
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            3. User Account
          </Typography>
          <Typography paragraph>
            To use our service, you must:
          </Typography>
          <Typography component="ul" paragraph>
            <li>Provide a valid email address</li>
            <li>Be at least 16 years of age</li>
            <li>Maintain the security of your account</li>
            <li>Notify us immediately of any unauthorized access</li>
          </Typography>
          <Typography paragraph>
            You are responsible for all activities that occur under your account.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            4. Acceptable Use Policy
          </Typography>
          <Typography paragraph>
            You agree not to use the service to:
          </Typography>
          <Typography component="ul" paragraph>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Distribute harmful or malicious content</li>
            <li>Attempt to gain unauthorized access to systems</li>
            <li>Engage in any form of harassment or abuse</li>
            <li>Interfere with the proper functioning of the service</li>
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            5. Intellectual Property
          </Typography>
          <Typography paragraph>
            <strong>Your Content:</strong> You retain all rights to the content you create within
            our service. By using our service, you grant us a limited license to host and display
            your content solely for the purpose of providing the service.
          </Typography>
          <Typography paragraph>
            <strong>Our Service:</strong> The service, its original content, features, and functionality
            are owned by us and are protected by international copyright, trademark, and other
            intellectual property laws.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            6. Privacy and Data Protection
          </Typography>
          <Typography paragraph>
            Your use of our service is also governed by our Privacy Policy. We are committed to
            GDPR compliance and protecting your personal data. Please review our Privacy Policy,
            which also governs your visit to our service.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            7. Service Availability
          </Typography>
          <Typography paragraph>
            We strive to provide continuous service availability but cannot guarantee:
          </Typography>
          <Typography component="ul" paragraph>
            <li>100% uptime or uninterrupted access</li>
            <li>Error-free or bug-free operation</li>
            <li>Protection against all security vulnerabilities</li>
          </Typography>
          <Typography paragraph>
            We reserve the right to modify or discontinue the service with reasonable notice.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            8. Limitation of Liability
          </Typography>
          <Typography paragraph>
            To the maximum extent permitted by law, we shall not be liable for any:
          </Typography>
          <Typography component="ul" paragraph>
            <li>Indirect, incidental, or consequential damages</li>
            <li>Loss of profits, data, or business opportunities</li>
            <li>Damages resulting from unauthorized access to your account</li>
          </Typography>
          <Typography paragraph>
            Our total liability shall not exceed the amount you have paid for the service
            in the past 12 months.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            9. Indemnification
          </Typography>
          <Typography paragraph>
            You agree to indemnify and hold us harmless from any claims, damages, or expenses
            arising from your use of the service, violation of these terms, or infringement of
            any rights of another party.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            10. Termination
          </Typography>
          <Typography paragraph>
            We may terminate or suspend your account immediately, without prior notice, for:
          </Typography>
          <Typography component="ul" paragraph>
            <li>Breach of these Terms of Service</li>
            <li>Fraudulent or illegal activities</li>
            <li>Extended period of inactivity</li>
          </Typography>
          <Typography paragraph>
            You may terminate your account at any time through the account settings or by
            contacting support. Upon termination, your data will be handled according to our
            Privacy Policy.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            11. Changes to Terms
          </Typography>
          <Typography paragraph>
            We reserve the right to modify these terms at any time. Material changes will be
            notified via email or through the service. Continued use after changes constitutes
            acceptance of the new terms.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            12. Governing Law
          </Typography>
          <Typography paragraph>
            These Terms shall be governed by and construed in accordance with the laws of the
            European Union, with specific attention to GDPR requirements, without regard to its
            conflict of law provisions.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            13. Contact Information
          </Typography>
          <Typography paragraph>
            For questions about these Terms of Service, please contact us at:
          </Typography>
          <Typography paragraph>
            Email: {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com'}
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
            onClick={() => router.push('/privacy')}
            underline="hover"
          >
            Privacy Policy
          </Link>
        </Box>
      </Paper>
    </Container>
  );
}