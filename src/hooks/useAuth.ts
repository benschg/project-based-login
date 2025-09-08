'use client';

import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        setAuthState({
          user: session?.user ?? null,
          session: session,
          loading: false,
        });
      } catch (err) {
        console.error('Session fetch error:', err);
        setAuthState({
          user: null,
          session: null,
          loading: false,
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      setAuthState({
        user: session?.user ?? null,
        session: session,
        loading: false,
      });

      // Log auth events for GDPR compliance
      if (session?.user && event === 'SIGNED_IN') {
        try {
          await supabase.rpc('log_gdpr_action', {
            p_user_id: session.user.id,
            p_action: 'login_successful',
            p_details: { 
              event,
              email: session.user.email,
              confirmed_at: session.user.email_confirmed_at
            },
            p_ip_address: null,
            p_user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
          });
        } catch (logError) {
          console.warn('Failed to log auth event:', logError);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return authState;
}

export async function signOut(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Log signout for GDPR compliance
    if (user) {
      try {
        await supabase.rpc('log_gdpr_action', {
          p_user_id: user.id,
          p_action: 'logout',
          p_details: { 
            email: user.email,
            logout_time: new Date().toISOString()
          },
          p_ip_address: null,
          p_user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
        });
      } catch (logError) {
        console.warn('Failed to log logout:', logError);
      }
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (err) {
    console.error('Sign out error:', err);
    throw err;
  }
}