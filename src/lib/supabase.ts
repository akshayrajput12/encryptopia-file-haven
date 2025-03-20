
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for required configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  // We'll provide fallback values from the integration file if available
}

// Use integration values as fallback if environment variables are not set
const finalSupabaseUrl = supabaseUrl || "https://pqiclidmixcogskvhxnz.supabase.co";
const finalSupabaseAnonKey = supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxaWNsaWRtaXhjb2dza3ZoeG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzNjg0OTUsImV4cCI6MjA1Nzk0NDQ5NX0.0m2SZxv_mp4bHDcWjLL9KczPC0gkp78Rm1ISjPe3ygs";

// Storage bucket names
export const STORAGE_BUCKETS = {
  FILES: 'files',
  AVATARS: 'avatars',
};

// Create a Supabase client
export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'secure-files-storage-key',
    storage: window.localStorage,
    detectSessionInUrl: true,
    flowType: 'pkce',
  }
});

// Type definitions
export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  owner_id: string;
  path: string;
  parent_id: string | null;
  is_encrypted: boolean;
  encryption_key?: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  metadata?: {
    lastModified?: number;
    isPasswordProtected?: boolean;
    salt?: string;
    verificationHash?: string;
    [key: string]: any;
  };
}

// Error handling utility
export function handleSupabaseError(error: any, message: string) {
  console.error(`${message}:`, error);
  
  let errorMessage = message;
  
  if (error?.message) {
    errorMessage = `${message}: ${error.message}`;
  } else if (error?.error_description) {
    errorMessage = `${message}: ${error.error_description}`;
  }
  
  toast.error(errorMessage);
}
