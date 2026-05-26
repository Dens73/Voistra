import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '../users/user.entity';

export type FriendRequestStatus = 'pending' | 'accepted';

@Entity('friend_requests')
@Unique(['requesterId', 'recipientId'])
export class FriendRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requesterId' })
  requester!: UserEntity;

  @Column()
  requesterId!: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient!: UserEntity;

  @Column()
  recipientId!: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status!: FriendRequestStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
