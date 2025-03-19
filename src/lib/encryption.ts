
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

/**
 * Encrypts a file using a password
 */
export const encryptFileWithPassword = async (file: File, password: string): Promise<{ 
  encryptedFile: File; 
  salt: string;
  verificationHash: string;
}> => {
  // Derive key from password
  const { key, salt } = await deriveKeyFromPassword(password);

  // Create a verification hash to check password correctness later
  const encoder = new TextEncoder();
  const verificationData = encoder.encode("VERIFICATION_STRING");
  const verificationEncrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(12).fill(1), // Fixed IV just for verification
    },
    key,
    verificationData
  );
  const verificationHash = btoa(String.fromCharCode(...new Uint8Array(verificationEncrypted)));

  // Generate a random initialization vector for file encryption
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
  
  // Convert salt to base64 for storage
  const saltBase64 = btoa(String.fromCharCode(...salt));
  
  return {
    encryptedFile,
    salt: saltBase64,
    verificationHash,
  };
};

/**
 * Decrypts a file that was encrypted with a password
 */
export const decryptFileWithPassword = async (
  encryptedFile: Blob, 
  password: string, 
  saltBase64: string,
  verificationHash: string
): Promise<{ success: boolean; decryptedFile?: Blob }> => {
  try {
    // Convert base64 salt back to Uint8Array
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    
    // Derive key from password and salt
    const { key } = await deriveKeyFromPassword(password, salt);
    
    // Verify password is correct using the verification hash
    try {
      const encoder = new TextEncoder();
      const verificationData = encoder.encode("VERIFICATION_STRING");
      const verificationEncrypted = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(12).fill(1), // Same fixed IV used during encryption
        },
        key,
        verificationData
      );
      const calculatedHash = btoa(String.fromCharCode(...new Uint8Array(verificationEncrypted)));
      
      if (calculatedHash !== verificationHash) {
        return { success: false };
      }
    } catch (error) {
      console.error("Verification failed:", error);
      return { success: false };
    }
    
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
    return {
      success: true,
      decryptedFile: new Blob([decryptedBuffer], { type: encryptedFile.type })
    };
  } catch (error) {
    console.error("Decryption failed:", error);
    return { success: false };
  }
};

/**
 * Verify a password against stored salt and verification hash
 */
export const verifyPassword = async (
  password: string,
  saltBase64: string,
  verificationHash: string
): Promise<boolean> => {
  try {
    // Convert base64 salt back to Uint8Array
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    
    // Derive key from password and salt
    const { key } = await deriveKeyFromPassword(password, salt);
    
    // Verify password is correct using the verification hash
    const encoder = new TextEncoder();
    const verificationData = encoder.encode("VERIFICATION_STRING");
    const verificationEncrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(12).fill(1), // Same fixed IV used during encryption
      },
      key,
      verificationData
    );
    const calculatedHash = btoa(String.fromCharCode(...new Uint8Array(verificationEncrypted)));
    
    return calculatedHash === verificationHash;
  } catch (error) {
    console.error("Password verification failed:", error);
    return false;
  }
};
