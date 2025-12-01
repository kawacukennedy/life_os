import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InstallationStatus {
  INSTALLING = 'installing',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  UNINSTALLED = 'uninstalled',
}

@Entity()
export class UserPlugin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  pluginId: string;

  @Column({
    type: 'enum',
    enum: InstallationStatus,
    default: InstallationStatus.INSTALLING,
  })
  status: InstallationStatus;

  @Column({ type: 'json', nullable: true })
  configuration: any; // User-specific configuration

  @Column({ type: 'json', nullable: true })
  credentials: any; // Encrypted credentials for the plugin

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @Column({ type: 'json', nullable: true })
  syncStatus: any; // Status of last sync operation

  @CreateDateColumn()
  installedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}