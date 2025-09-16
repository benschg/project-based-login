import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/paymentService';
import { createServerClient } from '@/lib/supabase/server';
import { projectService } from '@/lib/services/projectService';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createServerClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is owner or admin of the project
    const project = await projectService.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const userMember = project.members.find(m => m.userId === user.id);
    const isOwner = project.ownerId === user.id;
    const isAdmin = userMember?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { amount, currency = 'usd' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const transactionId = await paymentService.assignBudgetToProject({
      fromUserId: user.id,
      projectId,
      amount,
      currency,
    });

    return NextResponse.json({ 
      success: true, 
      transactionId,
      message: `Successfully assigned $${amount} to project budget`
    });
  } catch (error) {
    console.error('Budget assignment failed:', error);
    
    if (error instanceof Error && error.message === 'Insufficient balance') {
      return NextResponse.json(
        { error: 'Insufficient balance in your account' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to assign budget' },
      { status: 500 }
    );
  }
}