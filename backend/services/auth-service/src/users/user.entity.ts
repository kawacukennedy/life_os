import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: "user" })
  role: string;

  // Integration tokens
  @Column({ type: "json", nullable: true })
  googleTokens: {
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  };

  @Column({ type: "json", nullable: true })
  fitbitTokens: {
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  };

  @Column({ type: "json", nullable: true })
  plaidTokens: {
    accessToken: string;
    itemId: string;
  };

  @Column({ type: "json", nullable: true })
  preferences: {
    notifications: boolean;
    theme: string;
    language: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastActiveAt: Date;
}
