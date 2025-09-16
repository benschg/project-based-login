import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { projectService } from '@/lib/services/projectService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { email, role } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { id: projectId } = await params;

    // Invite member using Drizzle
    const invitation = await projectService.inviteMember(
      projectId,
      email.trim(),
      role || 'member',
      user.id
    );

    // Log GDPR action
    try {
      await projectService.logGdprAction(
        user.id,
        'invitation_created',
        { 
          project_id: projectId,
          invited_email: email.trim(),
          role: role || 'member',
          method: 'hobby_plan_invitation'
        },
        request.headers.get('user-agent') || undefined
      );
    } catch (logError) {
      console.warn('Failed to log GDPR action:', logError);
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}