import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Tenant } from "../auth/tenant.entity";

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

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.users)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

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
