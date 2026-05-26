import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ServerEntity } from '../servers/server.entity';
import { UserEntity } from '../users/user.entity';
import { TextMessageEntity } from './text-message.entity';

export enum ChannelType {
  TEXT = 'text',
  VOICE = 'voice',
}

@Entity('channels')
export class ChannelEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 64 })
  name!: string;

  @Column({ type: 'simple-enum', enum: ChannelType })
  type!: ChannelType;

  @Column({ default: false })
  isPrivate!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null;

  @ManyToOne(() => ServerEntity, (server) => server.channels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server!: ServerEntity;

  @Column()
  serverId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy!: UserEntity | null;

  @Column({ nullable: true })
  createdById!: string | null;

  @OneToMany(() => TextMessageEntity, (message) => message.channel)
  messages!: TextMessageEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
