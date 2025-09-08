import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { projectService } from '@/lib/services/projectService';

export async function GET(request: NextRequest) {
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

    // Get user's projects using Drizzle
    const projects = await projectService.getUserProjects(user.id);
    
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { name, description, privacyLevel } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Create project using Drizzle
    const project = await projectService.createProject({
      name: name.trim(),
      description: description?.trim(),
      privacyLevel: privacyLevel || 'private',
      ownerId: user.id
    });

    // Log GDPR action
    try {
      await projectService.logGdprAction(
        user.id,
        'account_created',
        { 
          project_id: project.id,
          project_name: name.trim(),
          privacy_level: privacyLevel || 'private'
        },
        request.headers.get('user-agent') || undefined
      );
    } catch (logError) {
      console.warn('Failed to log GDPR action:', logError);
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}