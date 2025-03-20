
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check active session on component mount
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setUser(session?.user || null);
        setLoading(false);

        // Listen for auth state changes
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, session) => {
            setUser(session?.user || null);
            if (event === 'SIGNED_IN') {
              // Update user profile with last sign-in time
              if (session?.user) {
                await supabase
                  .from('profiles')
                  .update({ last_sign_in: new Date().toISOString() })
                  .eq('id', session.user.id);
                
                navigate('/');
              }
            }
            
            if (event === 'SIGNED_OUT') {
              navigate('/auth');
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        handleSupabaseError(error, 'Failed to check auth session');
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      toast.success('Signed in successfully');
      navigate('/');
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
