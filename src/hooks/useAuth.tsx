
import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { User, supabase, handleSupabaseError } from '@/lib/supabase';
import { toast } from 'sonner';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setupTwoFactor: () => Promise<string | null>;
  verifyTwoFactor: (token: string) => Promise<boolean>;
  sendMagicLink: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for current session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          setUser(userData as User);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          setUser(userData as User);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      toast.success('Signed in successfully');
    } catch (error: any) {
      handleSupabaseError(error, 'Sign in failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      
      if (error) throw error;
      
      // Create profile record
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id, 
              email, 
              full_name: fullName,
              two_factor_enabled: false
            }
          ]);
          
        if (profileError) throw profileError;
      }
      
      toast.success('Account created successfully');
    } catch (error: any) {
      handleSupabaseError(error, 'Sign up failed');
      throw error;
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
    } catch (error: any) {
      handleSupabaseError(error, 'Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      
      toast.success('Password reset email sent');
    } catch (error: any) {
      handleSupabaseError(error, 'Password reset failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setLoading(true);
      
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local user state
      setUser((prev) => prev ? { ...prev, ...data } : null);
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      handleSupabaseError(error, 'Profile update failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setupTwoFactor = async () => {
    try {
      setLoading(true);
      
      if (!user) throw new Error('User not authenticated');
      
      // This is a placeholder. In a real implementation, you would:
      // 1. Call a Supabase Edge Function to generate a TOTP secret
      // 2. Return the secret and QR code URL to the user
      // 3. Update the user's profile when they verify their first code
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/SecureFiles:' + user.email;
      
      return qrCodeUrl;
    } catch (error: any) {
      handleSupabaseError(error, '2FA setup failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyTwoFactor = async (token: string) => {
    try {
      setLoading(true);
      
      if (!user) throw new Error('User not authenticated');
      
      // This is a placeholder. In a real implementation, you would:
      // 1. Call a Supabase Edge Function to verify the TOTP token
      // 2. Return success/failure
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple validation (in real app, you'd verify against TOTP algorithm)
      const isValid = token.length === 6 && !isNaN(Number(token));
      
      if (isValid) {
        // Update user profile to enable 2FA
        await updateProfile({ two_factor_enabled: true });
        toast.success('Two-factor authentication enabled');
      } else {
        toast.error('Invalid verification code');
      }
      
      return isValid;
    } catch (error: any) {
      handleSupabaseError(error, '2FA verification failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({ email });
      
      if (error) throw error;
      
      toast.success('Magic link sent to your email');
    } catch (error: any) {
      handleSupabaseError(error, 'Failed to send magic link');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateProfile,
      setupTwoFactor,
      verifyTwoFactor,
      sendMagicLink,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
