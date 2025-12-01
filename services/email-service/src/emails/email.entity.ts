import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Email {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  messageId: string; // Gmail message ID

  @Column()
  threadId: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column()
  sender: string;

  @Column({ type: 'simple-array' })
  recipients: string[];

  @Column({ type: 'timestamp' })
  receivedAt: Date;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ type: 'json', nullable: true })
  labels: string[];

  @Column({ type: 'text', nullable: true })
  summary: string; // AI-generated summary

  @Column({ type: 'json', nullable: true })
  suggestedActions: any[]; // Array of suggested actions

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}