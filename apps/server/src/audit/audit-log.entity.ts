import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from '../users/user.entity';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 64 })
  action!: string;

  @Column({ type: 'simple-json', nullable: true })
  details!: Record<string, unknown> | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity | null;

  @Column({ nullable: true })
  userId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
