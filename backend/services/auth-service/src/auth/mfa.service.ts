import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class MFAService {
  generateSecret(email: string) {
    const secret = speakeasy.generateSecret({
      name: `LifeOS (${email})`,
      issuer: 'LifeOS',
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    };
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time windows (30 seconds each)
    });
  }

  generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }

  validateBackupCode(storedCodes: string[], providedCode: string): boolean {
    const codes = JSON.parse(storedCodes || '[]');
    const index = codes.indexOf(providedCode);
    if (index > -1) {
      codes.splice(index, 1); // Remove used code
      return true;
    }
    return false;
  }
}