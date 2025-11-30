import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  private ivLength = 16;

  constructor() {
    // In production, use a proper key management service
    const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars!';
    this.key = crypto.scryptSync(secretKey, 'salt', 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, this.key);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encryptedData
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}