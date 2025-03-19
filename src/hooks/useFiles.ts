
import { useState, useEffect } from 'react';
import { supabase, FileItem, handleSupabaseError, STORAGE_BUCKETS } from '@/lib/supabase';
import { toast } from 'sonner';
import { encryptFile, decryptFile } from '@/lib/encryption';
import { validateFileContent } from '@/lib/security';
import { useAuth } from './useAuth';

export const useFiles = (parentId?: string | null) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  // Fetch files
  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      if (!user) return;
      
      let query = supabase
        .from('files')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
        
      // If parentId is provided, filter by parent
      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        // Root level files have null parent_id
        query = query.is('parent_id', null);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setFiles(data as FileItem[]);
    } catch (error) {
      handleSupabaseError(error, 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user, parentId]);

  // Upload file
  const uploadFile = async (file: File, encrypt: boolean = false, parentId?: string) => {
    try {
      if (!user) throw new Error('Not authenticated');
      
      setUploading(true);
      
      // Security check
      const isFileSafe = await validateFileContent(file);
      if (!isFileSafe) {
        toast.error('Security scan failed', {
          description: 'This file may contain malicious content.',
        });
        return null;
      }
      
      // Process file
      let fileToUpload = file;
      let encryptionKey = null;
      
      // Encrypt if requested
      if (encrypt) {
        const { encryptedFile, key } = await encryptFile(file);
        fileToUpload = encryptedFile;
        encryptionKey = key;
      }
      
      // Generate a unique file path
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.FILES)
        .upload(filePath, fileToUpload);
        
      if (uploadError) throw uploadError;
      
      // Create file record in database
      const newFile: Partial<FileItem> = {
        name: file.name,
        type: file.type,
        size: file.size,
        owner_id: user.id,
        path: filePath,
        parent_id: parentId || null,
        is_encrypted: encrypt,
        encryption_key: encryptionKey,
        is_shared: false,
        metadata: {
          lastModified: file.lastModified,
        },
      };
      
      const { data, error: dbError } = await supabase
        .from('files')
        .insert([newFile])
        .select();
        
      if (dbError) throw dbError;
      
      toast.success('File uploaded successfully');
      
      // Refresh file list
      fetchFiles();
      
      return data?.[0] as FileItem;
    } catch (error) {
      handleSupabaseError(error, 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Download file
  const downloadFile = async (fileId: string) => {
    try {
      if (!user) throw new Error('Not authenticated');
      
      // Get file details
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();
        
      if (fileError) throw fileError;
      
      const file = fileData as FileItem;
      
      // Check access permissions
      if (file.owner_id !== user.id && !file.is_shared) {
        throw new Error('You do not have permission to download this file');
      }
      
      // Download from storage
      const { data, error: downloadError } = await supabase.storage
        .from(STORAGE_BUCKETS.FILES)
        .download(file.path);
        
      if (downloadError) throw downloadError;
      
      if (!data) throw new Error('File not found');
      
      // Decrypt if encrypted
      let fileToDownload = data;
      if (file.is_encrypted && file.encryption_key) {
        fileToDownload = await decryptFile(data, file.encryption_key);
      }
      
      // Create download link
      const url = URL.createObjectURL(fileToDownload);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      handleSupabaseError(error, 'Download failed');
      return false;
    }
  };

  // Delete file
  const deleteFile = async (fileId: string) => {
    try {
      if (!user) throw new Error('Not authenticated');
      
      // Get file details
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();
        
      if (fileError) throw fileError;
      
      const file = fileData as FileItem;
      
      // Check ownership
      if (file.owner_id !== user.id) {
        throw new Error('You do not have permission to delete this file');
      }
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKETS.FILES)
        .remove([file.path]);
        
      if (storageError) throw storageError;
      
      // Delete database record
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);
        
      if (dbError) throw dbError;
      
      // Update file list
      setFiles(files.filter((f) => f.id !== fileId));
      
      toast.success('File deleted successfully');
      return true;
    } catch (error) {
      handleSupabaseError(error, 'Delete failed');
      return false;
    }
  };

  // Share file
  const shareFile = async (fileId: string, email: string, permission: 'read' | 'write' | 'admin') => {
    try {
      if (!user) throw new Error('Not authenticated');
      
      // Get file details
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();
        
      if (fileError) throw fileError;
      
      const file = fileData as FileItem;
      
      // Check ownership
      if (file.owner_id !== user.id) {
        throw new Error('You do not have permission to share this file');
      }
      
      // Find user to share with
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
        
      if (userError) throw new Error('User not found');
      
      const sharedWithUserId = userData.id;
      
      // Create share record
      const { error: shareError } = await supabase
        .from('file_shares')
        .insert([{
          file_id: fileId,
          shared_by: user.id,
          shared_with: sharedWithUserId,
          permission,
        }]);
        
      if (shareError) throw shareError;
      
      // Update file record
      const { error: updateError } = await supabase
        .from('files')
        .update({ is_shared: true })
        .eq('id', fileId);
        
      if (updateError) throw updateError;
      
      // Refresh file list
      fetchFiles();
      
      toast.success('File shared successfully');
      return true;
    } catch (error) {
      handleSupabaseError(error, 'Share failed');
      return false;
    }
  };

  // Get file metadata
  const getFileMetadata = async (fileId: string) => {
    try {
      if (!user) throw new Error('Not authenticated');
      
      // Get file details with share information
      const { data, error } = await supabase
        .from('files')
        .select(`
          *,
          file_shares(
            id,
            shared_with,
            permission,
            created_at,
            profiles:shared_with(email, full_name)
          )
        `)
        .eq('id', fileId)
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      handleSupabaseError(error, 'Failed to fetch file metadata');
      return null;
    }
  };

  // Create folder
  const createFolder = async (name: string, parentId?: string) => {
    try {
      if (!user) throw new Error('Not authenticated');
      
      const newFolder: Partial<FileItem> = {
        name,
        type: 'folder',
        size: 0,
        owner_id: user.id,
        path: '',
        parent_id: parentId || null,
        is_encrypted: false,
        is_shared: false,
      };
      
      const { data, error } = await supabase
        .from('files')
        .insert([newFolder])
        .select();
        
      if (error) throw error;
      
      toast.success('Folder created successfully');
      
      // Refresh file list
      fetchFiles();
      
      return data?.[0] as FileItem;
    } catch (error) {
      handleSupabaseError(error, 'Failed to create folder');
      return null;
    }
  };

  return {
    files,
    loading,
    uploading,
    uploadFile,
    downloadFile,
    deleteFile,
    shareFile,
    getFileMetadata,
    createFolder,
    refreshFiles: fetchFiles,
  };
};
