
import config from '../../config.json';

// Enhanced encryption utility for Supabase integration
export class EncryptionManager {
  private static instance: EncryptionManager;
  private encryptionKey: CryptoKey | null = null;
  private isInitialized = false;

  private constructor() {
    this.initializeEncryption();
  }

  public static getInstance(): EncryptionManager {
    if (!EncryptionManager.instance) {
      EncryptionManager.instance = new EncryptionManager();
    }
    return EncryptionManager.instance;
  }

  private async initializeEncryption() {
    try {
      // Generate or retrieve encryption key
      const keyData = localStorage.getItem('crimson_encryption_key');
      
      if (keyData) {
        // Import existing key
        const keyBuffer = new Uint8Array(JSON.parse(keyData));
        this.encryptionKey = await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new key
        this.encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        
        // Export and store key
        const keyBuffer = await crypto.subtle.exportKey('raw', this.encryptionKey);
        localStorage.setItem('crimson_encryption_key', JSON.stringify(Array.from(new Uint8Array(keyBuffer))));
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      this.isInitialized = false;
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initializeEncryption();
    }
  }

  public async encryptMessage(message: string): Promise<string> {
    if (!config.encryption.enabled) {
      return message;
    }

    try {
      await this.ensureInitialized();
      
      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        data
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Return base64 encoded result
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return message; // Fallback to plain text
    }
  }

  public async decryptMessage(encryptedMessage: string): Promise<string> {
    if (!config.encryption.enabled) {
      return encryptedMessage;
    }

    try {
      await this.ensureInitialized();
      
      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }

      // Decode base64
      const combined = new Uint8Array(
        atob(encryptedMessage).split('').map(char => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encrypted
      );

      // Decode the result
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedMessage; // Fallback to encrypted text
    }
  }

  public async encryptFile(file: File): Promise<File> {
    if (!config.encryption.enabled) {
      return file;
    }

    try {
      await this.ensureInitialized();
      
      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }

      const arrayBuffer = await file.arrayBuffer();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        arrayBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return new File([combined], file.name, { type: file.type });
    } catch (error) {
      console.error('File encryption failed:', error);
      return file;
    }
  }

  public getEncryptionStatus(): { enabled: boolean; algorithm: string; keyLength: number } {
    return {
      enabled: config.encryption.enabled && this.isInitialized,
      algorithm: config.encryption.algorithm,
      keyLength: this.encryptionKey ? 256 : 0
    };
  }
}
