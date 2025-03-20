
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimer, setSessionTimer] = useState<number | null>(null);
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

  useEffect(() => {
    // Set up auth state listener FIRST to prevent missing auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state change:", event, currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (event === 'SIGNED_IN') {
          // Reset session timer on sign in
          resetSessionTimer();
          
          // Update user profile with last sign-in time
          if (currentSession?.user) {
            try {
              await supabase
                .from('profiles')
                .update({ last_sign_in: new Date().toISOString() })
                .eq('id', currentSession.user.id);
              
              navigate('/');
            } catch (error) {
              console.error("Error updating last_sign_in:", error);
            }
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
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        // If user is signed in, reset the session timer
        if (currentSession?.user) {
          resetSessionTimer();
        }
        
        setLoading(false);
      } catch (error) {
        handleSupabaseError(error, 'Failed to check auth session');
        setLoading(false);
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

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
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
      const { error } = await supabase.auth.signOut();
      
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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
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
