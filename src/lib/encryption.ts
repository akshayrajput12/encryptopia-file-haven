
// Secure file encryption utilities
// This is a simplified version for demonstration purposes

/**
 * Encrypts a file using AES-GCM encryption
 * In a production environment, consider using a more robust encryption library
 * and securely managing encryption keys
 */
export const encryptFile = async (file: File): Promise<{ encryptedFile: File; key: string }> => {
  // Generate a random encryption key
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  // Generate a random initialization vector
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // Read file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer();
  
  // Encrypt the file
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    fileBuffer
  );
  
  // Combine IV and encrypted data
  const combinedBuffer = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combinedBuffer.set(iv);
  combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length);
  
  // Create a new file with encrypted content
  const encryptedFile = new File([combinedBuffer], file.name, {
    type: file.type,
    lastModified: file.lastModified,
  });
  
  // Export key as base64 string
  const exportedKey = await window.crypto.subtle.exportKey('raw', key);
  const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
  
  return {
    encryptedFile,
    key: keyBase64,
  };
};

/**
 * Decrypts a file that was encrypted with AES-GCM
 */
export const decryptFile = async (encryptedFile: Blob, keyBase64: string): Promise<Blob> => {
  // Convert base64 key back to CryptoKey
  const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  const key = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['decrypt']
  );
  
  // Read encrypted file
  const encryptedBuffer = await encryptedFile.arrayBuffer();
  const encryptedData = new Uint8Array(encryptedBuffer);
  
  // Extract IV from the beginning of the file
  const iv = encryptedData.slice(0, 12);
  const ciphertext = encryptedData.slice(12);
  
  // Decrypt the file
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    ciphertext
  );
  
  // Create a new Blob with decrypted content
  return new Blob([decryptedBuffer], { type: encryptedFile.type });
};

/**
 * Hashes a password to derive an encryption key
 */
export const deriveKeyFromPassword = async (password: string, salt?: Uint8Array): Promise<{
  key: CryptoKey;
  salt: Uint8Array;
}> => {
  // Generate salt if not provided
  const useSalt = salt || window.crypto.getRandomValues(new Uint8Array(16));
  
  // Convert password to buffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Derive key using PBKDF2
  const importedKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive a key for AES-GCM
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: useSalt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  return {
    key: derivedKey,
    salt: useSalt,
  };
};
