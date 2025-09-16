'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { AccountBalance, CreditCard } from '@mui/icons-material';
import CreditPurchaseDialog from '@/components/credits/CreditPurchaseDialog';
import TransactionHistory from '@/components/credits/TransactionHistory';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';

interface UserBalance {
  balance: string;
  currency: 'usd' | 'eur' | 'gbp';
}

function CreditsPageContent() {
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for success/cancel parameters from Stripe redirect
  const paymentSuccess = searchParams.get('success');
  const paymentCancelled = searchParams.get('cancelled');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    fetchBalance();
  }, [user, router]);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/credits/balance');
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      const data = await response.json();
      setBalance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balance');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    const symbols = { usd: '$', eur: '€', gbp: '£' };
    return `${symbols[currency as keyof typeof symbols] || '$'}${amount}`;
  };

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Account Credits
      </Typography>

      {paymentSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => router.replace('/dashboard/credits')}>
          Payment successful! Your credits have been added to your account.
        </Alert>
      )}

      {paymentCancelled && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => router.replace('/dashboard/credits')}>
          Payment was cancelled. You can try again anytime.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AccountBalance color="primary" />
                <Typography variant="h6">Current Balance</Typography>
              </Box>
              
              {isLoading ? (
                <Typography variant="h3" color="text.secondary">
                  Loading...
                </Typography>
              ) : balance ? (
                <Typography variant="h3" color="primary">
                  {formatCurrency(balance.balance, balance.currency)}
                </Typography>
              ) : (
                <Typography variant="h3" color="text.secondary">
                  $0.00
                </Typography>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Available for project budget assignments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Purchase Credits
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add funds to your account to assign budgets to projects
              </Typography>
              <Button
                variant="contained"
                startIcon={<CreditCard />}
                onClick={() => setShowPurchaseDialog(true)}
                size="large"
                fullWidth
              >
                Buy Credits
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              How Credits Work
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <li>Purchase credits using your credit card through secure Stripe checkout</li>
              <li>Credits are instantly added to your account balance after successful payment</li>
              <li>Use credits to assign budgets to projects you own or manage</li>
              <li>Only project owners and admins can assign budgets to projects</li>
              <li>All transactions are tracked for your records</li>
              <li>Credits do not expire and remain in your account until used</li>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TransactionHistory limit={50} />
        </Grid>
      </Grid>

      <CreditPurchaseDialog
        open={showPurchaseDialog}
        onClose={() => setShowPurchaseDialog(false)}
        currentBalance={balance?.balance}
        currency={balance?.currency}
      />
    </Container>
  );
}

export default function CreditsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreditsPageContent />
    </Suspense>
  );
}