import Stripe from 'stripe';
import { db, userCredits, transactions } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export interface CreateCheckoutSessionData {
  userId: string;
  amount: number;
  currency?: 'usd' | 'eur' | 'gbp';
  successUrl: string;
  cancelUrl: string;
}

export interface CreditPurchaseResult {
  sessionId: string;
  checkoutUrl: string;
  transactionId: string;
}

export interface UserBalance {
  balance: string;
  currency: 'usd' | 'eur' | 'gbp';
}

export interface AssignBudgetData {
  fromUserId: string;
  projectId: string;
  amount: number;
  currency?: 'usd' | 'eur' | 'gbp';
}

export const paymentService = {
  async createCheckoutSession(data: CreateCheckoutSessionData): Promise<CreditPurchaseResult> {
    const currency = data.currency || 'usd';
    
    // Create pending transaction record
    const [transaction] = await db.insert(transactions).values({
      userId: data.userId,
      type: 'credit_purchase',
      status: 'pending',
      amount: data.amount.toString(),
      currency,
      description: `Credit purchase: $${data.amount}`,
    }).returning({ id: transactions.id });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'Account Credits',
              description: `Add $${data.amount} to your account balance`,
            },
            unit_amount: Math.round(data.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${data.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: data.cancelUrl,
      metadata: {
        userId: data.userId,
        transactionId: transaction.id,
        amount: data.amount.toString(),
        currency,
      },
    });

    // Update transaction with Stripe session ID
    await db
      .update(transactions)
      .set({ 
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
      })
      .where(eq(transactions.id, transaction.id));

    return {
      sessionId: session.id,
      checkoutUrl: session.url!,
      transactionId: transaction.id,
    };
  },

  async handleSuccessfulPayment(sessionId: string): Promise<void> {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    const { userId, transactionId, amount, currency } = session.metadata!;
    
    // Start transaction to ensure consistency
    await db.transaction(async (tx) => {
      // Update transaction status
      await tx
        .update(transactions)
        .set({ 
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(transactions.id, transactionId));

      // Create or update user credits
      const existingCredit = await tx
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      if (existingCredit.length > 0) {
        // Update existing balance
        await tx
          .update(userCredits)
          .set({
            balance: sql`${userCredits.balance} + ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(userCredits.userId, userId));
      } else {
        // Create new credit record
        await tx.insert(userCredits).values({
          userId,
          balance: amount,
          currency: currency as 'usd' | 'eur' | 'gbp',
        });
      }
    });
  },

  async getUserBalance(userId: string): Promise<UserBalance | null> {
    const [userCredit] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    return userCredit ? {
      balance: userCredit.balance,
      currency: userCredit.currency,
    } : null;
  },

  async assignBudgetToProject(data: AssignBudgetData): Promise<string> {
    const currency = data.currency || 'usd';
    
    return await db.transaction(async (tx) => {
      // Check user has sufficient balance
      const [userCredit] = await tx
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, data.fromUserId))
        .limit(1);

      if (!userCredit || parseFloat(userCredit.balance) < data.amount) {
        throw new Error('Insufficient balance');
      }

      // Create budget assignment transaction
      const [transaction] = await tx.insert(transactions).values({
        userId: data.fromUserId,
        type: 'budget_assignment',
        status: 'completed',
        amount: data.amount.toString(),
        currency,
        projectId: data.projectId,
        description: `Budget assigned to project`,
        completedAt: new Date(),
      }).returning({ id: transactions.id });

      // Deduct from user balance
      await tx
        .update(userCredits)
        .set({
          balance: sql`${userCredits.balance} - ${data.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, data.fromUserId));

      // Update project budget
      await tx.execute(
        sql`
          UPDATE ${db.projects} 
          SET budget_amount = budget_amount + ${data.amount}
          WHERE id = ${data.projectId}
        `
      );

      return transaction.id;
    });
  },

  async getTransactionHistory(userId: string, limit = 50): Promise<any[]> {
    return await db
      .select({
        id: transactions.id,
        type: transactions.type,
        status: transactions.status,
        amount: transactions.amount,
        currency: transactions.currency,
        description: transactions.description,
        createdAt: transactions.createdAt,
        completedAt: transactions.completedAt,
        projectId: transactions.projectId,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(sql`${transactions.createdAt} DESC`)
      .limit(limit);
  },

  async refundTransaction(transactionId: string, reason?: string): Promise<void> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (!transaction || transaction.status !== 'completed') {
      throw new Error('Transaction not found or not eligible for refund');
    }

    if (transaction.stripePaymentIntentId) {
      // Process Stripe refund
      await stripe.refunds.create({
        payment_intent: transaction.stripePaymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          originalTransactionId: transactionId,
          refundReason: reason || 'User requested refund',
        },
      });
    }

    // Create refund transaction record
    await db.insert(transactions).values({
      userId: transaction.userId,
      type: 'credit_refund',
      status: 'completed',
      amount: transaction.amount,
      currency: transaction.currency,
      description: `Refund for transaction ${transactionId}`,
      completedAt: new Date(),
      metadata: { originalTransactionId: transactionId, refundReason: reason },
    });

    // Update original transaction status
    await db
      .update(transactions)
      .set({ status: 'refunded' })
      .where(eq(transactions.id, transactionId));
  },
};