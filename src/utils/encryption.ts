
// Simple encryption utility for demonstration
// In production, use proper end-to-end encryption libraries

export class EncryptionManager {
  private static instance: EncryptionManager;
  private encryptionKey: string;

  private constructor() {
    // Generate or retrieve encryption key
    this.encryptionKey = this.generateEncryptionKey();
  }

  public static getInstance(): EncryptionManager {
    if (!EncryptionManager.instance) {
      EncryptionManager.instance = new EncryptionManager();
    }
    return EncryptionManager.instance;
  }

  private generateEncryptionKey(): string {
    // In production, use proper key derivation
    return localStorage.getItem('crimson_encryption_key') || this.createNewKey();
  }

  private createNewKey(): string {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem('crimson_encryption_key', key);
    return key;
  }

  public async encryptMessage(message: string): Promise<string> {
    try {
      // Simple XOR encryption for demo (use proper encryption in production)
      const encrypted = this.xorEncrypt(message, this.encryptionKey);
      return btoa(encrypted); // Base64 encode
    } catch (error) {
      console.error('Encryption failed:', error);
      return message; // Fallback to plain text
    }
  }

  public async decryptMessage(encryptedMessage: string): Promise<string> {
    try {
      const decoded = atob(encryptedMessage); // Base64 decode
      return this.xorEncrypt(decoded, this.encryptionKey);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedMessage; // Fallback to encrypted text
    }
  }

  private xorEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  }

  public getEncryptionStatus(): { enabled: boolean; keyLength: number } {
    return {
      enabled: true,
      keyLength: this.encryptionKey.length
    };
  }
}
