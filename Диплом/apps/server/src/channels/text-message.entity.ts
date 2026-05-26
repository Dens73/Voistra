import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from '../users/user.entity';
import { ChannelEntity } from './channel.entity';

@Entity('text_messages')
export class TextMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @ManyToOne(() => ChannelEntity, (channel) => channel.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channelId' })
  channel!: ChannelEntity;

  @Column()
  channelId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'authorId' })
  author!: UserEntity | null;

  @Column({ nullable: true })
  authorId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
