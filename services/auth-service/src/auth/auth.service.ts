import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "../users/user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
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
