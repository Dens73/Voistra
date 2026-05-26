import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('direct_conversations')
@Unique(['participantAId', 'participantBId'])
export class DirectConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  participantAId!: string;

  @Column()
  participantBId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
