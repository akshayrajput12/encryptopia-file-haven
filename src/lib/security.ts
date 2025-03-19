
/**
 * Security utilities for detecting and preventing common security threats
 * Note: This is a simplified demonstration and should be enhanced
 * with more robust security measures in a production environment
 */

// Signature patterns for common malware/threats
const MALWARE_SIGNATURES = [
  // Simplified patterns for demonstration
  { name: 'JS Obfuscated Code', pattern: /eval\s*\(\s*function\s*\(\s*p,a,c,k,e,d/ },
  { name: 'Potential Executable', pattern: /^MZ/ },
  { name: 'Potential Buffer Overflow', pattern: /(%[0-9A-F]{2}){20,}/ },
  { name: 'Potential SQL Injection', pattern: /'.*OR.*['"].*=/ },
  { name: 'Potential XSS', pattern: /<script.*>.*<\/script>/ },
];

// Maximum file size for content scanning (50MB)
const MAX_SCAN_SIZE = 50 * 1024 * 1024;

// Check for buffer overflow attempts in strings
export const detectBufferOverflow = (input: string): boolean => {
  // Check for common buffer overflow patterns
  // This is a simplified check and not comprehensive
  
  // Check for large repeating sequences
  const hasLargeRepeats = /(.)\1{100,}/.test(input);
  
  // Check for format string vulnerabilities
  const hasFormatStrings = /%[0-9]*[diouxXeEfFgGaAcspn]/.test(input);
  
  // Check for long hex sequences that might be shellcode
  const hasHexSequences = /([0-9A-F]{2}){50,}/i.test(input);
  
  return hasLargeRepeats || hasFormatStrings || hasHexSequences;
};

// Scan file content for potential threats
export const validateFileContent = async (file: File): Promise<boolean> => {
  // Skip large files
  if (file.size > MAX_SCAN_SIZE) {
    console.warn('File too large for content scanning');
    return true; // Skip validation for large files
  }
  
  // Check file type - block potentially dangerous types
  const dangerousTypes = [
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-msdos-windows',
    'application/x-download',
    'application/bat',
    'application/x-bat',
    'application/com',
    'application/x-com',
    'application/exe',
    'application/x-exe',
    'application/x-winexe',
    'application/vnd.microsoft.portable-executable',
  ];
  
  if (dangerousTypes.includes(file.type)) {
    console.error('Potentially dangerous file type detected:', file.type);
    return false;
  }
  
  try {
    // Read file content
    const buffer = await file.arrayBuffer();
    
    // For text files, scan content for malware signatures
    if (file.type.startsWith('text/') || 
        file.type === 'application/json' ||
        file.type === 'application/javascript') {
      const text = new TextDecoder().decode(buffer);
      
      // Check for buffer overflow attempts
      if (detectBufferOverflow(text)) {
        console.error('Potential buffer overflow attack detected');
        return false;
      }
      
      // Check for malware signatures
      for (const signature of MALWARE_SIGNATURES) {
        if (signature.pattern.test(text)) {
          console.error('Potential threat detected:', signature.name);
          return false;
        }
      }
    } else {
      // For binary files, check file headers
      const bytes = new Uint8Array(buffer.slice(0, 4));
      const header = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Check for executable files
      if (header.startsWith('4d5a')) { // 'MZ' header (Windows executable)
        console.error('Executable file detected');
        return false;
      }
      
      if (header.startsWith('7f454c46')) { // ELF header (Linux executable)
        console.error('Executable file detected');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error scanning file:', error);
    return false;
  }
};

// Check string input for potential XSS attacks
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Log security events (in a real app, you might send these to a server)
export const logSecurityEvent = (
  eventType: 'warning' | 'error' | 'info',
  message: string,
  details?: any
) => {
  const event = {
    timestamp: new Date().toISOString(),
    type: eventType,
    message,
    details,
  };
  
  console.log('Security event:', event);
  
  // In a real app, you would send this to your security monitoring system
};
