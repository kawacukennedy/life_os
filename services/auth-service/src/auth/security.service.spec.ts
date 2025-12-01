import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityService } from './security.service';
import { User } from '../users/user.entity';

describe('SecurityService', () => {
  let service: SecurityService;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<SecurityService>(SecurityService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'testPassword123';
      const hash = await service.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hash = await service.hashPassword(password);

      const isValid = await service.comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await service.hashPassword(password);

      const isValid = await service.comparePassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', async () => {
      const result = await service.validatePasswordStrength('StrongPass123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak password', async () => {
      const result = await service.validatePasswordStrength('weak');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject common passwords', async () => {
      const result = await service.validatePasswordStrength('password');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is too common');
    });
  });

  describe('generateSecureToken', () => {
    it('should generate secure token of specified length', () => {
      const token = service.generateSecureToken(32);

      expect(token).toBeDefined();
      expect(token.length).toBe(64); // hex encoding doubles the byte length
    });
  });

  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const sanitized = service.sanitizeInput(input);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello World');
    });

    it('should remove HTML tags', () => {
      const input = '<b>Bold</b> text';
      const sanitized = service.sanitizeInput(input);

      expect(sanitized).toBe('Bold text');
    });

    it('should remove SQL injection patterns', () => {
      const input = 'SELECT * FROM users';
      const sanitized = service.sanitizeInput(input);

      expect(sanitized).not.toContain('SELECT');
      expect(sanitized).not.toContain('FROM');
    });

    it('should limit input length', () => {
      const longInput = 'a'.repeat(15000);
      const sanitized = service.sanitizeInput(longInput);

      expect(sanitized.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('encryptSensitiveData and decryptSensitiveData', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const originalData = 'sensitive information';
      const encrypted = await service.encryptSensitiveData(originalData);
      const decrypted = await service.decryptSensitiveData(encrypted);

      expect(encrypted).not.toBe(originalData);
      expect(decrypted).toBe(originalData);
    });
  });

  describe('detectSuspiciousActivity', () => {
    it('should detect suspicious activity patterns', async () => {
      const result = await service.detectSuspiciousActivity('user1', 'multiple_failed_logins');

      expect(result.isSuspicious).toBe(true);
      expect(result.riskLevel).toBe('medium');
      expect(result.reasons).toContain('Detected multiple_failed_logins');
    });

    it('should detect multiple login failures', async () => {
      const result = await service.detectSuspiciousActivity('user1', 'login_failed', {
        recentFailures: 5,
      });

      expect(result.isSuspicious).toBe(true);
      expect(result.reasons).toContain('Multiple recent login failures');
    });

    it('should detect unusual login hours', async () => {
      const result = await service.detectSuspiciousActivity('user1', 'login_success', {
        hour: 3,
      });

      expect(result.isSuspicious).toBe(true);
      expect(result.reasons).toContain('Login during unusual hours');
    });

    it('should not flag normal activity', async () => {
      const result = await service.detectSuspiciousActivity('user1', 'login_success', {
        hour: 14,
      });

      expect(result.isSuspicious).toBe(false);
      expect(result.riskLevel).toBe('low');
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.logSecurityEvent('user1', 'login_attempt', { ip: '127.0.0.1' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Security Event: login_attempt for user user1',
        { ip: '127.0.0.1' }
      );

      consoleSpy.mockRestore();
    });
  });
});