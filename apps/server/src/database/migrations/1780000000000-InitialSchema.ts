import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1780000000000 implements MigrationInterface {
  name = 'InitialSchema1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" varchar(32) NOT NULL,
        "displayName" varchar(64) NOT NULL,
        "avatarUrl" text,
        "bio" varchar(280),
        "passwordHash" varchar NOT NULL,
        "reconnectEnabled" boolean NOT NULL DEFAULT true,
        "pushToTalkEnabled" boolean NOT NULL DEFAULT false,
        "voiceActivationEnabled" boolean NOT NULL DEFAULT true,
        "noiseSuppressionEnabled" boolean NOT NULL DEFAULT true,
        "echoCancellationEnabled" boolean NOT NULL DEFAULT true,
        "autoGainControlEnabled" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_username" UNIQUE ("username")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "servers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(64) NOT NULL,
        "description" varchar(256),
        "ownerId" uuid NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_servers_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_servers_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "server_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "serverId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "role" varchar(32) NOT NULL DEFAULT 'member',
        "bannedUntil" timestamp,
        "mutedUntil" timestamp,
        "deafenedUntil" timestamp,
        "screenShareBlockedUntil" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_server_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_server_members_server_user" UNIQUE ("serverId", "userId"),
        CONSTRAINT "FK_server_members_server" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_server_members_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "channels" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(64) NOT NULL,
        "type" varchar NOT NULL,
        "isPrivate" boolean NOT NULL DEFAULT false,
        "passwordHash" varchar(255),
        "serverId" uuid NOT NULL,
        "createdById" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_channels_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_channels_type" CHECK ("type" IN ('text', 'voice')),
        CONSTRAINT "FK_channels_server" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_channels_created_by" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "text_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "content" text NOT NULL,
        "channelId" uuid NOT NULL,
        "authorId" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_text_messages_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_text_messages_channel" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_text_messages_author" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action" varchar(64) NOT NULL,
        "details" text,
        "userId" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "friend_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "requesterId" uuid NOT NULL,
        "recipientId" uuid NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'pending',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_friend_requests_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_friend_requests_pair" UNIQUE ("requesterId", "recipientId"),
        CONSTRAINT "FK_friend_requests_requester" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_friend_requests_recipient" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "direct_conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "participantAId" uuid NOT NULL,
        "participantBId" uuid NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_direct_conversations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_direct_conversations_pair" UNIQUE ("participantAId", "participantBId")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "direct_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversationId" uuid NOT NULL,
        "authorId" uuid,
        "content" text NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_direct_messages_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_direct_messages_conversation" FOREIGN KEY ("conversationId") REFERENCES "direct_conversations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_direct_messages_author" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "direct_messages"');
    await queryRunner.query('DROP TABLE IF EXISTS "direct_conversations"');
    await queryRunner.query('DROP TABLE IF EXISTS "friend_requests"');
    await queryRunner.query('DROP TABLE IF EXISTS "audit_logs"');
    await queryRunner.query('DROP TABLE IF EXISTS "text_messages"');
    await queryRunner.query('DROP TABLE IF EXISTS "channels"');
    await queryRunner.query('DROP TABLE IF EXISTS "server_members"');
    await queryRunner.query('DROP TABLE IF EXISTS "servers"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');
  }
}
