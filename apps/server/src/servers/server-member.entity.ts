import {
  type ColumnType,
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

const memberDateColumnType: ColumnType = process.env.DB_TYPE === 'postgres' ? 'timestamp' : 'datetime';

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

  @Column({ type: memberDateColumnType, nullable: true })
  bannedUntil!: Date | null;

  @Column({ type: memberDateColumnType, nullable: true })
  mutedUntil!: Date | null;

  @Column({ type: memberDateColumnType, nullable: true })
  deafenedUntil!: Date | null;

  @Column({ type: memberDateColumnType, nullable: true })
  screenShareBlockedUntil!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
