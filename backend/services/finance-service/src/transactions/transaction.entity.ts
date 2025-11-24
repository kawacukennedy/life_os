import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  accountId: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  postedAt: Date;
}