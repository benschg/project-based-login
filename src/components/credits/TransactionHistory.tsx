'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  History,
  ExpandMore,
  ExpandLess,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AccountBalance,
  Assignment,
} from '@mui/icons-material';

interface Transaction {
  id: string;
  type: 'credit_purchase' | 'credit_refund' | 'budget_assignment' | 'budget_usage' | 'budget_withdrawal';
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount: string;
  currency: 'usd' | 'eur' | 'gbp';
  description: string;
  createdAt: string;
  completedAt: string | null;
  projectId: string | null;
}

interface TransactionHistoryProps {
  limit?: number;
}

export default function TransactionHistory({ limit = 20 }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/credits/transactions?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTransactions();
  }, [limit, fetchTransactions]);

  const formatCurrency = (amount: string, currency: string) => {
    const symbols = { usd: '$', eur: '€', gbp: '£' };
    return `${symbols[currency as keyof typeof symbols] || '$'}${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'credit_purchase':
        return <CreditCard color="primary" />;
      case 'credit_refund':
        return <TrendingDown color="error" />;
      case 'budget_assignment':
        return <Assignment color="success" />;
      case 'budget_usage':
        return <TrendingDown color="warning" />;
      case 'budget_withdrawal':
        return <TrendingUp color="info" />;
      default:
        return <AccountBalance />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getAmountColor = (type: Transaction['type']) => {
    switch (type) {
      case 'credit_purchase':
      case 'budget_withdrawal':
        return 'success.main';
      case 'credit_refund':
      case 'budget_assignment':
      case 'budget_usage':
        return 'error.main';
      default:
        return 'text.primary';
    }
  };

  const getAmountPrefix = (type: Transaction['type']) => {
    switch (type) {
      case 'credit_purchase':
      case 'budget_withdrawal':
        return '+';
      case 'credit_refund':
      case 'budget_assignment':
      case 'budget_usage':
        return '-';
      default:
        return '';
    }
  };

  const displayedTransactions = expanded ? transactions : transactions.slice(0, 5);

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <History />
          <Typography variant="h6">Transaction History</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <History />
          <Typography variant="h6">Transaction History</Typography>
        </Box>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History />
          <Typography variant="h6">Transaction History</Typography>
        </Box>
        {transactions.length > 5 && (
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Box>

      {transactions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <History sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No transactions yet
          </Typography>
          <Typography variant="body2">
            Your payment and budget transactions will appear here
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTransactionIcon(transaction.type)}
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {transaction.type.replace('_', ' ')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {transaction.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={getAmountColor(transaction.type)}
                    >
                      {getAmountPrefix(transaction.type)}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.status}
                      color={getStatusColor(transaction.status)}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(transaction.createdAt)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!expanded && transactions.length > 5 && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {displayedTransactions.length} of {transactions.length} transactions
          </Typography>
        </Box>
      )}
    </Paper>
  );
}