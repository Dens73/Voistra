import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { UserEntity } from '../users/user.entity';
import { ServerEntity } from './server.entity';

@Entity('server_members')
@Unique(['serverId', 'userId'])
export class ServerMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ServerEntity, (server) => server.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server!: ServerEntity;

  @Column()
  serverId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column()
  userId!: string;

  @Column({ default: 'member', length: 32 })
  role!: string;

  @Column({ type: 'datetime', nullable: true })
  bannedUntil!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  mutedUntil!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  deafenedUntil!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  screenShareBlockedUntil!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
