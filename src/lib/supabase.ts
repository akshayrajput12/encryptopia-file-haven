
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Initialize the Supabase client
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

// Note: The actual keys should be provided by the user after connecting Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any, message = 'An error occurred') => {
  console.error('Supabase error:', error);
  toast.error(message, {
    description: error.message || 'Please try again later.',
  });
};

// Define database schema types
export type User = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  last_sign_in?: string;
  two_factor_enabled: boolean;
};

export type FileItem = {
  id: string;
  name: string;
  type: string;
  size: number;
  owner_id: string;
  path: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  is_encrypted: boolean;
  encryption_key?: string;
  is_shared: boolean;
  shared_with?: string[];
  metadata?: Record<string, any>;
};

export type FileShare = {
  id: string;
  file_id: string;
  shared_by: string;
  shared_with: string;
  permission: 'read' | 'write' | 'admin';
  created_at: string;
  expires_at?: string;
};

// Storage bucket names
export const STORAGE_BUCKETS = {
  FILES: 'files',
  PROFILE_IMAGES: 'profile-images',
};
