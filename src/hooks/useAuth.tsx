
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { safeRequest } from '@/lib/requestUtils';

interface AuthContextType {
  user: any | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout duration in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;
// Debounce session updates to prevent rapid consecutive calls
const SESSION_UPDATE_DEBOUNCE = 5000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimer, setSessionTimer] = useState<number | null>(null);
  const [lastSessionUpdate, setLastSessionUpdate] = useState<number>(0);
  const navigate = useNavigate();

  // Function to reset session timer
  const resetSessionTimer = () => {
    // Clear any existing timer
    if (sessionTimer) {
      window.clearTimeout(sessionTimer);
    }
    
    // Set new timer for 30 minutes
    const newTimer = window.setTimeout(async () => {
      toast.info("Your session has expired. Please sign in again.");
      await signOut();
    }, SESSION_TIMEOUT);
    
    setSessionTimer(newTimer);
  };

  // Update profile with last sign-in time (debounced)
  const updateLastSignIn = async (userId: string) => {
    const now = Date.now();
    // Only update if it's been at least SESSION_UPDATE_DEBOUNCE since the last update
    if (now - lastSessionUpdate < SESSION_UPDATE_DEBOUNCE) {
      return;
    }
    
    setLastSessionUpdate(now);
    
    try {
      await safeRequest(() => 
        supabase
          .from('profiles')
          .update({ last_sign_in: new Date().toISOString() })
          .eq('id', userId)
      );
    } catch (error) {
      console.error("Error updating last_sign_in:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Set up auth state listener FIRST to prevent missing auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state change:", event, currentSession?.user?.id);
        
        if (!isMounted) return;
        
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (event === 'SIGNED_IN') {
          // Reset session timer on sign in
          resetSessionTimer();
          
          // Update user profile with last sign-in time
          if (currentSession?.user) {
            updateLastSignIn(currentSession.user.id);
            navigate('/');
          }
        }
        
        if (event === 'SIGNED_OUT') {
          // Clear session timer on sign out
          if (sessionTimer) {
            window.clearTimeout(sessionTimer);
            setSessionTimer(null);
          }
          navigate('/');
        }
      }
    );

    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await safeRequest(() => 
          supabase.auth.getSession()
        );
        
        if (error) throw error;
        
        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user || null);
          
          // If user is signed in, reset the session timer
          if (currentSession?.user) {
            resetSessionTimer();
          }
          
          setLoading(false);
        }
      } catch (error) {
        handleSupabaseError(error, 'Failed to check auth session');
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Set up activity listeners to reset the timer on user activity
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleUserActivity = () => {
      if (user) {
        resetSessionTimer();
      }
    };
    
    activityEvents.forEach(eventType => {
      window.addEventListener(eventType, handleUserActivity);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      
      // Clean up activity listeners
      activityEvents.forEach(eventType => {
        window.removeEventListener(eventType, handleUserActivity);
      });
      
      // Clear any existing timer
      if (sessionTimer) {
        window.clearTimeout(sessionTimer);
      }
    };
  }, [navigate, sessionTimer, user]);

  // Authentication functions
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await safeRequest(() => 
        supabase.auth.signInWithPassword({ email, password })
      );
      
      if (error) throw error;
      
      toast.success('Signed in successfully');
    } catch (error) {
      handleSupabaseError(error, 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const { error } = await safeRequest(() => 
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })
      );
      
      if (error) throw error;
      
      toast.success('Sign up successful! Please check your email to verify your account.');
    } catch (error) {
      handleSupabaseError(error, 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await safeRequest(() => supabase.auth.signOut());
      
      if (error) throw error;
      
      // Clear session timer
      if (sessionTimer) {
        window.clearTimeout(sessionTimer);
        setSessionTimer(null);
      }
      
      toast.success('Signed out successfully');
    } catch (error) {
      handleSupabaseError(error, 'Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await safeRequest(() => 
        supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        })
      );
      
      if (error) throw error;
      
      toast.success('Magic link sent! Please check your email.');
    } catch (error) {
      handleSupabaseError(error, 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    sendMagicLink,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
