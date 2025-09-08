import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { authService } from '@/lib/services/authService';
import { projectService } from '@/lib/services/projectService';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client for auth
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Claim pending invitations using Drizzle
    const claimedCount = await authService.claimPendingInvitations(user.id, email.trim());

    if (claimedCount > 0) {
      // Log GDPR action
      try {
        await projectService.logGdprAction(
          user.id,
          'invitations_claimed',
          { 
            claimed_count: claimedCount,
            email: email.trim()
          },
          request.headers.get('user-agent') || undefined
        );
      } catch (logError) {
        console.warn('Failed to log GDPR action:', logError);
      }
    }

    return NextResponse.json({ claimedCount });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}