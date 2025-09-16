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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { AccountBalance, TrendingUp } from '@mui/icons-material';

interface AssignBudgetDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  currentBalance?: string;
  currency?: string;
  onSuccess?: () => void;
}

export default function AssignBudgetDialog({ 
  open, 
  onClose, 
  projectId,
  projectName,
  currentBalance = '0.00',
  currency = 'usd',
  onSuccess
}: AssignBudgetDialogProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || '';
    setAmount(value);
    setError(null);
  };

  const handleAssignBudget = async () => {
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const availableBalance = parseFloat(currentBalance);
    if (amount > availableBalance) {
      setError('Amount exceeds your available balance');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/budget`, {
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
        throw new Error(errorData.error || 'Failed to assign budget');
      }

      const result = await response.json();
      setSuccess(result.message);
      setAmount('');
      
      // Call success callback after a brief delay to show success message
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    const symbols = { usd: '$', eur: '€', gbp: '£' };
    return `${symbols[currency as keyof typeof symbols] || '$'}${amount}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <TrendingUp />
          Assign Budget to Project
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Project: <strong>{projectName}</strong>
        </Typography>

        <Box mb={3}>
          <Alert severity="info" icon={<AccountBalance />}>
            <Typography variant="body2">
              Available Balance: <strong>{formatCurrency(currentBalance, currency)}</strong>
            </Typography>
          </Alert>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box display="flex" gap={2} mb={3}>
          <TextField
            label="Amount to Assign"
            type="number"
            value={amount}
            onChange={handleAmountChange}
            inputProps={{ min: 0.01, step: 0.01 }}
            sx={{ flex: 1 }}
            disabled={isLoading || !!success}
            helperText={`Maximum: ${formatCurrency(currentBalance, currency)}`}
          />
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Currency</InputLabel>
            <Select
              value={selectedCurrency}
              label="Currency"
              onChange={(e) => setSelectedCurrency(e.target.value)}
              disabled={isLoading || !!success}
            >
              <MenuItem value="usd">USD ($)</MenuItem>
              <MenuItem value="eur">EUR (€)</MenuItem>
              <MenuItem value="gbp">GBP (£)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Alert severity="warning">
          <Typography variant="body2">
            • This will deduct {formatCurrency(String(amount || 0), selectedCurrency)} from your account balance
            • The budget will be added to the project immediately
            • This action cannot be undone easily
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isLoading && !success}>
          Cancel
        </Button>
        <Button 
          onClick={handleAssignBudget}
          variant="contained"
          disabled={!amount || amount <= 0 || isLoading || !!success}
          startIcon={isLoading ? <CircularProgress size={20} /> : <TrendingUp />}
        >
          {isLoading ? 'Assigning...' : `Assign ${formatCurrency(String(amount || 0), selectedCurrency)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}