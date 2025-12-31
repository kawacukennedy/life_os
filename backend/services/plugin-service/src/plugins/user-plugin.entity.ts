import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Plugin } from "./plugin.entity";

export enum InstallationStatus {
  INSTALLING = 'installing',
  INSTALLED = 'installed',
  FAILED = 'failed',
  UNINSTALLING = 'uninstalling',
  UNINSTALLED = 'uninstalled',
}

@Entity('user_plugins')
@Index(['userId', 'pluginId'], { unique: true })
export class UserPlugin {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  pluginId: string;

  @ManyToOne(() => Plugin)
  @JoinColumn({ name: 'pluginId' })
  plugin: Plugin;

  @Column({
    type: 'enum',
    enum: InstallationStatus,
    default: InstallationStatus.INSTALLING,
  })
  status: InstallationStatus;

  @Column({ nullable: true })
  installedVersion: string;

  @Column({ type: 'json', nullable: true })
  settings: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  permissions: string[];

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ type: 'json', nullable: true })
  installationMetadata: {
    source: 'marketplace' | 'direct' | 'auto';
    referrer?: string;
    campaign?: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}