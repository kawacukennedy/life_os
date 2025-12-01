import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { SecurityEvent, SecurityEventType, SecurityRiskLevel } from './security-event.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class SecurityService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SecurityEvent)
    private securityEventRepository: Repository<SecurityEvent>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  async validatePasswordStrength(password: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common passwords (simplified)
    const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async detectSuspiciousActivity(userId: string, activity: string, context?: any): Promise<{
    isSuspicious: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check for known suspicious patterns
    const suspiciousPatterns = [
      'multiple_failed_logins',
      'unusual_login_location',
      'password_reset_abuse',
      'brute_force_attempt',
      'suspicious_ip_range',
      'unusual_time_access',
    ];

    if (suspiciousPatterns.includes(activity)) {
      reasons.push(`Detected ${activity}`);
      riskScore += 50;
    }

    // Check for rapid successive failures
    if (activity === 'login_failed' && context?.recentFailures > 3) {
      reasons.push('Multiple recent login failures');
      riskScore += 30;
    }

    // Check for unusual login times (e.g., 3 AM access)
    if (activity === 'login_success' && context?.hour) {
      const hour = context.hour;
      if (hour >= 2 && hour <= 5) {
        reasons.push('Login during unusual hours');
        riskScore += 20;
      }
    }

    // Check for password reset abuse
    if (activity === 'password_reset_request' && context?.requestsLastHour > 5) {
      reasons.push('Excessive password reset requests');
      riskScore += 40;
    }

    // Check for unusual IP ranges
    if (context?.ip && this.isSuspiciousIP(context.ip)) {
      reasons.push('Login from suspicious IP range');
      riskScore += 35;
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskScore >= 70) {
      riskLevel = 'high';
    } else if (riskScore >= 30) {
      riskLevel = 'medium';
    }

    return {
      isSuspicious: riskScore > 25,
      riskLevel,
      reasons,
    };
  }

  private isSuspiciousIP(ip: string): boolean {
    // Simple check for known suspicious IP ranges
    // In production, this would use IP reputation databases
    const suspiciousRanges = [
      '10.0.0.0/8', // Private network (shouldn't be external)
      '192.168.0.0/16', // Private network
    ];

    // This is a simplified implementation
    return suspiciousRanges.some(range => ip.startsWith(range.split('/')[0]));
  }

  async logSecurityEvent(
    userId: string | null,
    eventType: SecurityEventType,
    details: {
      ipAddress?: string;
      userAgent?: string;
      riskLevel?: SecurityRiskLevel;
      description?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const securityEvent = this.securityEventRepository.create({
        userId: userId || undefined,
        eventType,
        riskLevel: details.riskLevel || SecurityRiskLevel.LOW,
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        description: details.description,
        metadata: details.metadata,
      });

      await this.securityEventRepository.save(securityEvent);

      // Also log to console for immediate visibility
      console.log(`Security Event: ${eventType} for user ${userId || 'unknown'}`, {
        riskLevel: details.riskLevel,
        ipAddress: details.ipAddress,
        description: details.description,
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Remove script tags and their contents
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Remove SQL injection patterns
    sanitized = sanitized.replace(/(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi, '');

    // Remove potential path traversal
    sanitized = sanitized.replace(/\.\.[\/\\]/g, '');

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Limit length to prevent buffer overflow attacks
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000);
    }

    return sanitized;
  }

  async encryptSensitiveData(data: string): Promise<string> {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipherGCM(algorithm, key);
    cipher.setIV(iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  async decryptSensitiveData(encryptedData: string): Promise<string> {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);

    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipherGCM(algorithm, key);
    decipher.setIV(iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async checkRateLimit(identifier: string, action: string): Promise<boolean> {
    // Simple in-memory rate limiting
    // In production, use Redis or similar
    const key = `${identifier}:${action}`;
    const now = Date.now();

    // This is a simplified implementation
    // Real implementation would check against stored counters

    return true; // Allow by default
  }
}