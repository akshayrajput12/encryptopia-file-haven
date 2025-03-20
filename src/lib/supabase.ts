
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Storage bucket names
export const STORAGE_BUCKETS = {
  FILES: 'files',
  AVATARS: 'avatars',
};

// Create a Supabase client with 30-minute session timeout
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'secure-files-storage-key',
    localStorage: window.localStorage,
    detectSessionInUrl: true,
    flowType: 'pkce',
    sessionTimeout: 1800, // 30 minutes in seconds
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
