import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "../users/user.entity";
import { MonitoringService } from "./monitoring.service";
import { LoggerService } from "./logger.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private readonly monitoringService: MonitoringService,
    private readonly loggerService: LoggerService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const startTime = Date.now();
    try {
      const user = await this.usersRepository.findOne({ where: { email } });
      this.monitoringService.recordDbQuery('findOne', 'user', Date.now() - startTime, !!user);

      if (user && (await bcrypt.compare(password, user.passwordHash))) {
        this.monitoringService.recordAuthAttempt('password', true);
        this.loggerService.logAuthEvent('login_success', { email }, user.id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...result } = user;
        return result;
      }

      this.monitoringService.recordAuthAttempt('password', false);
      this.loggerService.logSecurityEvent('login_failed', { email, reason: 'invalid_credentials' });
      return null;
    } catch (error) {
      this.monitoringService.recordDbQuery('findOne', 'user', Date.now() - startTime, false);
      this.monitoringService.recordAuthAttempt('password', false);
      this.loggerService.logSecurityEvent('login_error', { email, error: error.message });
      throw error;
    }
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.generateRefreshToken(),
      user,
    };
  }

  async register(userData: {
    email: string;
    password: string;
    fullName: string;
    timezone: string;
  }) {
    const startTime = Date.now();
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = this.usersRepository.create({
        ...userData,
        passwordHash: hashedPassword,
      });
      const savedUser = await this.usersRepository.save(user);
      this.monitoringService.recordDbQuery('save', 'user', Date.now() - startTime, true);

      this.loggerService.logAuthEvent('registration_success', { email: userData.email }, savedUser.id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = savedUser;
      return result;
    } catch (error) {
      this.monitoringService.recordDbQuery('save', 'user', Date.now() - startTime, false);
      this.loggerService.logSecurityEvent('registration_error', { email: userData.email, error: error.message });
      throw error;
    }
  }

  private generateRefreshToken(): string {
    // In production, store in DB with expiry
    return this.jwtService.sign({}, { expiresIn: "30d" });
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
