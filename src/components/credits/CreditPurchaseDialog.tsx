'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CreditCard, AccountBalance } from '@mui/icons-material';

interface CreditPurchaseDialogProps {
  open: boolean;
  onClose: () => void;
  currentBalance?: string;
  currency?: string;
}

const predefinedAmounts = [10, 25, 50, 100, 250, 500];

export default function CreditPurchaseDialog({ 
  open, 
  onClose, 
  currentBalance = '0.00',
  currency = 'usd' 
}: CreditPurchaseDialogProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAmountSelect = (value: number) => {
    setAmount(value);
  };

  const handleCustomAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || '';
    setAmount(value);
  };

  const handlePurchase = async () => {
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(amount),
          currency: selectedCurrency,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    const symbols = { usd: '$', eur: '€', gbp: '£' };
    return `${symbols[currency as keyof typeof symbols] || '$'}${amount}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CreditCard />
          Purchase Credits
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box mb={3}>
          <Alert severity="info" icon={<AccountBalance />}>
            <Typography variant="body2">
              Current Balance: <strong>{formatCurrency(currentBalance, currency)}</strong>
            </Typography>
          </Alert>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="h6" gutterBottom>
          Select Amount
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {predefinedAmounts.map((presetAmount) => (
            <Grid size={{ xs: 6, sm: 4 }} key={presetAmount}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: amount === presetAmount ? 2 : 1,
                  borderColor: amount === presetAmount ? 'primary.main' : 'divider',
                  '&:hover': { borderColor: 'primary.main' }
                }}
                onClick={() => handleAmountSelect(presetAmount)}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6">
                    {formatCurrency(presetAmount.toString(), selectedCurrency)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="subtitle1" gutterBottom>
          Or enter custom amount:
        </Typography>

        <Box display="flex" gap={2} mb={3}>
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={handleCustomAmountChange}
            inputProps={{ min: 1, step: 0.01 }}
            sx={{ flex: 1 }}
            disabled={isLoading}
          />
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Currency</InputLabel>
            <Select
              value={selectedCurrency}
              label="Currency"
              onChange={(e) => setSelectedCurrency(e.target.value)}
              disabled={isLoading}
            >
              <MenuItem value="usd">USD ($)</MenuItem>
              <MenuItem value="eur">EUR (€)</MenuItem>
              <MenuItem value="gbp">GBP (£)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Alert severity="info">
          <Typography variant="body2">
            • Credits are added to your account instantly after successful payment
            • Use credits to assign budgets to your projects
            • All payments are securely processed by Stripe
            • You can view your transaction history in your account settings
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handlePurchase}
          variant="contained"
          disabled={!amount || amount <= 0 || isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <CreditCard />}
        >
          {isLoading ? 'Processing...' : `Purchase ${formatCurrency(String(amount || 0), selectedCurrency)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}