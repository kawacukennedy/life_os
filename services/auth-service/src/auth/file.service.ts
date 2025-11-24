import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/user.entity";
import { LoggerService } from "./logger.service";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private logger: LoggerService,
  ) {}

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    try {
      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const filename = `${uuidv4()}${fileExtension}`;
      const uploadPath = path.join(
        process.cwd(),
        "uploads",
        "avatars",
        filename,
      );

      // Ensure directory exists
      const dir = path.dirname(uploadPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Save file
      fs.writeFileSync(uploadPath, file.buffer);

      // Update user avatar
      await this.userRepository.update(userId, { avatar: filename });

      this.logger.log("Avatar uploaded successfully", { userId, filename });
      return filename;
    } catch (error) {
      this.logger.error("Failed to upload avatar", error, { userId });
      throw error;
    }
  }

  async deleteAvatar(userId: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user?.avatar) {
        const filePath = path.join(
          process.cwd(),
          "uploads",
          "avatars",
          user.avatar,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await this.userRepository.update(userId, { avatar: null });
        this.logger.log("Avatar deleted successfully", { userId });
      }
    } catch (error) {
      this.logger.error("Failed to delete avatar", error, { userId });
      throw error;
    }
  }

  getAvatarUrl(filename: string): string {
    return `${process.env.BASE_URL || "http://localhost:3001"}/uploads/avatars/${filename}`;
  }
}
