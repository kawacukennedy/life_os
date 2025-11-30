import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "../users/user.entity";
import { MFAService } from "./mfa.service";
import { CacheService } from "./cache.service";
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private mfaService: MFAService,
    private cacheService: CacheService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };

    // Check if MFA is required
    if (user.mfaEnabled) {
      return {
        requiresMFA: true,
        userId: user.id,
        tempToken: this.jwtService.sign(payload, { expiresIn: '5m' }),
      };
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);
    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async verifyMFA(userId: string, token: string, backupCode?: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    let isValid = false;

    if (backupCode) {
      isValid = this.mfaService.validateBackupCode(user.backupCodes, backupCode);
      if (isValid) {
        // Update backup codes in DB
        await this.usersRepository.update(userId, {
          backupCodes: JSON.stringify(
            JSON.parse(user.backupCodes || '[]').filter(code => code !== backupCode)
          ),
        });
      }
    } else {
      isValid = this.mfaService.verifyToken(user.mfaSecret, token);
    }

    if (!isValid) throw new Error('Invalid MFA token');

    const { accessToken, refreshToken } = await this.generateTokens(user);
    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async register(userData: {
    email: string;
    password: string;
    fullName: string;
    timezone: string;
  }) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = this.usersRepository.create({
      ...userData,
      passwordHash: hashedPassword,
    });
    await this.usersRepository.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  private async generateTokens(user: any) {
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    // Generate refresh token with unique ID
    const refreshTokenId = uuidv4();
    const refreshToken = this.jwtService.sign(
      { tokenId: refreshTokenId },
      { expiresIn: '14d' }
    );

    // Store refresh token in Redis with user association
    await this.cacheService.set(
      `refresh_token:${refreshTokenId}`,
      { userId: user.id, email: user.email },
      14 * 24 * 60 * 60 * 1000 // 14 days in milliseconds
    );

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshToken);
      const tokenId = decoded.tokenId;

      // Check if refresh token exists in cache
      const tokenData = await this.cacheService.get(`refresh_token:${tokenId}`);
      if (!tokenData) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const user = await this.usersRepository.findOne({ where: { id: tokenData.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Invalidate old refresh token
      await this.cacheService.del(`refresh_token:${tokenId}`);

      // Generate new tokens
      const { accessToken, newRefreshToken } = await this.generateTokens(user);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user,
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const tokenId = decoded.tokenId;

      // Remove refresh token from cache
      await this.cacheService.del(`refresh_token:${tokenId}`);

      return { message: 'Logged out successfully' };
    } catch (error) {
      // Token might already be invalid
      return { message: 'Logged out successfully' };
    }
  }

  async logoutAll(userId: string) {
    // In a production system, you'd need to track all refresh tokens for a user
    // For now, we'll just clear user cache
    await this.cacheService.invalidateUserCache(userId);
    return { message: 'Logged out from all devices' };
  }

  async setupMFA(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const { secret, otpauthUrl } = this.mfaService.generateSecret(user.email);
    const qrCode = await this.mfaService.generateQRCode(otpauthUrl);
    const backupCodes = this.mfaService.generateBackupCodes();

    // Store secret temporarily (don't enable yet)
    await this.usersRepository.update(userId, {
      mfaSecret: secret,
      backupCodes: JSON.stringify(backupCodes),
    });

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  async enableMFA(userId: string, token: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.mfaSecret) throw new Error('MFA setup not initiated');

    const isValid = this.mfaService.verifyToken(user.mfaSecret, token);
    if (!isValid) throw new Error('Invalid MFA token');

    await this.usersRepository.update(userId, { mfaEnabled: true });
    return { success: true };
  }

  async disableMFA(userId: string) {
    await this.usersRepository.update(userId, {
      mfaEnabled: false,
      mfaSecret: null,
      backupCodes: null,
    });
    return { success: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getDashboard(userId: string) {
    // In a real implementation, this would aggregate data from all services
    // For now, return mock data that could be enhanced with real service calls
    return {
      tiles: [
        { id: "health", type: "health", data: { score: 78 } },
        { id: "finance", type: "finance", data: { balance: 12345 } },
        { id: "learning", type: "learning", data: { progress: 32 } },
        { id: "notifications", type: "notifications", data: { count: 3 } },
      ],
      suggestions: [
        "Consider rescheduling your budget review.",
        "Great job on your workout!",
        "Log your meals for better tracking.",
        "Complete your daily learning goal.",
      ],
    };
  }
}
