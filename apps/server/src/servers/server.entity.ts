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

import { ChannelEntity } from '../channels/channel.entity';
import { UserEntity } from '../users/user.entity';
import { ServerMemberEntity } from './server-member.entity';

@Entity('servers')
export class ServerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 64 })
  name!: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  description!: string | null;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner!: UserEntity;

  @Column()
  ownerId!: string;

  @OneToMany(() => ServerMemberEntity, (member) => member.server)
  members!: ServerMemberEntity[];

  @OneToMany(() => ChannelEntity, (channel) => channel.server)
  channels!: ChannelEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
