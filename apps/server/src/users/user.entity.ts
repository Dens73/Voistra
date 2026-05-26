import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 32 })
  username!: string;

  @Column({ length: 64 })
  displayName!: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'varchar', length: 280, nullable: true })
  bio!: string | null;

  @Column()
  passwordHash!: string;

  @Column({ default: true })
  reconnectEnabled!: boolean;

  @Column({ default: false })
  pushToTalkEnabled!: boolean;

  @Column({ default: true })
  voiceActivationEnabled!: boolean;

  @Column({ default: true })
  noiseSuppressionEnabled!: boolean;

  @Column({ default: true })
  echoCancellationEnabled!: boolean;

  @Column({ default: true })
  autoGainControlEnabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
