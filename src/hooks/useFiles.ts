
import { useState, useEffect } from 'react';
import { supabase, FileItem, handleSupabaseError, STORAGE_BUCKETS } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  encryptFile, 
  decryptFile, 
  encryptFileWithPassword, 
  decryptFileWithPassword, 
  verifyPassword 
} from '@/lib/encryption';
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
  const uploadFile = async (file: File, encrypt: boolean = false, password?: string, parentId?: string) => {
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
      let salt = null;
      let verificationHash = null;
      let isPasswordProtected = false;
      
      // Encrypt with password if provided
      if (password) {
        const { encryptedFile, salt: passwordSalt, verificationHash: passwordHash } = 
          await encryptFileWithPassword(file, password);
        
        fileToUpload = encryptedFile;
        salt = passwordSalt;
        verificationHash = passwordHash;
        isPasswordProtected = true;
      }
      // Regular encryption if requested and no password
      else if (encrypt) {
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
        is_encrypted: encrypt || isPasswordProtected,
        encryption_key: encryptionKey,
        is_shared: false,
        metadata: {
          lastModified: file.lastModified,
          isPasswordProtected: isPasswordProtected,
          salt: salt,
          verificationHash: verificationHash
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
  const downloadFile = async (fileId: string, password?: string) => {
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
      
      let fileToDownload: Blob;
      
      // Check if file is password protected
      if (file.metadata?.isPasswordProtected) {
        if (!password) {
          // If no password provided, inform caller that password is needed
          toast.info('This file is password protected', { 
            description: 'Please enter the password to download this file.' 
          });
          return { needsPassword: true, file };
        }
        
        // Decrypt with password
        const salt = file.metadata.salt;
        const verificationHash = file.metadata.verificationHash;
        
        const { success, decryptedFile } = await decryptFileWithPassword(
          data, 
          password, 
          salt, 
          verificationHash
        );
        
        if (!success || !decryptedFile) {
          toast.error('Incorrect password');
          return { success: false, message: 'Incorrect password' };
        }
        
        fileToDownload = decryptedFile;
      }
      // Regular decryption if encrypted but not password protected
      else if (file.is_encrypted && file.encryption_key) {
        fileToDownload = await decryptFile(data, file.encryption_key);
      } else {
        // Not encrypted
        fileToDownload = data;
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
      
      return { success: true };
    } catch (error) {
      handleSupabaseError(error, 'Download failed');
      return { success: false, message: 'Download failed' };
    }
  };

  // Verify file password and get decrypted file
  const verifyFilePassword = async (fileId: string, password: string) => {
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
      
      // Download from storage
      const { data, error: downloadError } = await supabase.storage
        .from(STORAGE_BUCKETS.FILES)
        .download(file.path);
        
      if (downloadError) throw downloadError;
      
      if (!data) throw new Error('File not found');
      
      // Check if file is password protected
      if (!file.metadata?.isPasswordProtected) {
        throw new Error('File is not password protected');
      }
      
      // Verify and decrypt with password
      const salt = file.metadata.salt;
      const verificationHash = file.metadata.verificationHash;
      
      const result = await decryptFileWithPassword(
        data, 
        password, 
        salt, 
        verificationHash
      );
      
      return result;
    } catch (error) {
      handleSupabaseError(error, 'Password verification failed');
      return { success: false };
    }
  };

  // Set password for a file
  const setFilePassword = async (fileId: string, password: string) => {
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
        throw new Error('You do not have permission to modify this file');
      }
      
      // Check if file is already password protected
      if (file.metadata?.isPasswordProtected) {
        throw new Error('File is already password protected');
      }
      
      // Download from storage
      const { data, error: downloadError } = await supabase.storage
        .from(STORAGE_BUCKETS.FILES)
        .download(file.path);
        
      if (downloadError) throw downloadError;
      
      if (!data) throw new Error('File not found');
      
      // Decrypt if file is already encrypted
      let decryptedFile: Blob;
      if (file.is_encrypted && file.encryption_key) {
        decryptedFile = await decryptFile(data, file.encryption_key);
      } else {
        decryptedFile = data;
      }
      
      // Convert blob to File
      const originalFile = new File([decryptedFile], file.name, {
        type: file.type,
        lastModified: file.metadata?.lastModified || Date.now(),
      });
      
      // Encrypt with password
      const { encryptedFile, salt, verificationHash } = 
        await encryptFileWithPassword(originalFile, password);
      
      // Update file in storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.FILES)
        .update(file.path, encryptedFile);
        
      if (uploadError) throw uploadError;
      
      // Update file record in database
      const { error: updateError } = await supabase
        .from('files')
        .update({
          is_encrypted: true,
          encryption_key: null, // Remove old encryption key
          metadata: {
            ...file.metadata,
            isPasswordProtected: true,
            salt,
            verificationHash
          }
        })
        .eq('id', fileId);
        
      if (updateError) throw updateError;
      
      // Refresh file list
      fetchFiles();
      
      return true;
    } catch (error) {
      handleSupabaseError(error, 'Failed to set password');
      return false;
    }
  };

  // Reset password for a file
  const resetFilePassword = async (fileId: string, newPassword: string) => {
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
        throw new Error('You do not have permission to modify this file');
      }
      
      // Check if file is password protected
      if (!file.metadata?.isPasswordProtected) {
        throw new Error('File is not password protected');
      }
      
      // Download from storage
      const { data, error: downloadError } = await supabase.storage
        .from(STORAGE_BUCKETS.FILES)
        .download(file.path);
        
      if (downloadError) throw downloadError;
      
      if (!data) throw new Error('File not found');
      
      // For password reset, admin can bypass the old password
      // In a real system, you might require the old password or have a separate reset flow
      
      // Create file reader to get original file content
      const fileReader = new FileReader();
      const filePromise = new Promise<ArrayBuffer>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
        fileReader.onerror = reject;
        fileReader.readAsArrayBuffer(data);
      });
      
      const fileArrayBuffer = await filePromise;
      
      // Create new file from old file
      const originalFile = new File([fileArrayBuffer], file.name, {
        type: file.type,
        lastModified: file.metadata?.lastModified || Date.now(),
      });
      
      // Encrypt with new password
      const { encryptedFile, salt, verificationHash } = 
        await encryptFileWithPassword(originalFile, newPassword);
      
      // Update file in storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.FILES)
        .update(file.path, encryptedFile);
        
      if (uploadError) throw uploadError;
      
      // Update file record in database
      const { error: updateError } = await supabase
        .from('files')
        .update({
          metadata: {
            ...file.metadata,
            salt,
            verificationHash
          }
        })
        .eq('id', fileId);
        
      if (updateError) throw updateError;
      
      // Refresh file list
      fetchFiles();
      
      return true;
    } catch (error) {
      handleSupabaseError(error, 'Failed to reset password');
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
    setFilePassword,
    verifyFilePassword,
    resetFilePassword
  };
};
