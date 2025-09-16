import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/paymentService';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency = 'usd' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    
    const result = await paymentService.createCheckoutSession({
      userId: user.id,
      amount,
      currency,
      successUrl: `${origin}/dashboard/credits?success=true`,
      cancelUrl: `${origin}/dashboard/credits?cancelled=true`,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}