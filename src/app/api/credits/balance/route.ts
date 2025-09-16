import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/paymentService';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const balance = await paymentService.getUserBalance(user.id);
    
    return NextResponse.json({
      balance: balance?.balance || '0.00',
      currency: balance?.currency || 'usd',
    });
  } catch (error) {
    console.error('Failed to fetch user balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}