import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';

import { AuditService } from '../audit/audit.service';
import { ChannelEntity } from '../channels/channel.entity';
import { ServerMemberEntity } from '../servers/server-member.entity';
import type { AuthPayload, NetworkMetrics, VoiceParticipant } from './realtime.types';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/ws',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly voiceRooms = new Map<string, Map<string, VoiceParticipant>>();
  private readonly metrics = new Map<string, NetworkMetrics>();
  private readonly onlineUsers = new Map<string, number>();

  constructor(
    @InjectRepository(ChannelEntity)
    private readonly channelsRepository: Repository<ChannelEntity>,
    @InjectRepository(ServerMemberEntity)
    private readonly membersRepository: Repository<ServerMemberEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'dev_access_secret'),
      });
      client.data.user = payload;
      this.onlineUsers.set(payload.sub, (this.onlineUsers.get(payload.sub) ?? 0) + 1);
      client.emit('session.ready', {
        user: payload,
        turn: {
          url: this.configService.get<string>('TURN_URL', 'turn:localhost:3478'),
          username: this.configService.get<string>('TURN_USERNAME', 'demo'),
          password: this.configService.get<string>('TURN_PASSWORD', 'demo'),
        },
      });
      this.broadcastOnlineUsers();
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user as AuthPayload | undefined;
    if (user?.sub) {
      const nextCount = (this.onlineUsers.get(user.sub) ?? 1) - 1;
      if (nextCount <= 0) {
        this.onlineUsers.delete(user.sub);
      } else {
        this.onlineUsers.set(user.sub, nextCount);
      }
      this.broadcastOnlineUsers();
    }

    for (const [channelId, participants] of this.voiceRooms.entries()) {
      if (participants.has(client.id)) {
        const participant = participants.get(client.id)!;
        participants.delete(client.id);
        this.server.to(this.voiceRoom(channelId)).emit('voice:participants', Array.from(participants.values()));
        await this.auditService.log('voice.left', { channelId }, participant.userId);
      }

      if (participants.size === 0) {
        this.voiceRooms.delete(channelId);
      }
    }

    this.metrics.delete(client.id);
  }

  @SubscribeMessage('presence:list')
  handlePresence() {
    return {
      onlineUserIds: Array.from(this.onlineUsers.keys()),
      rooms: Array.from(this.voiceRooms.entries()).map(([channelId, participants]) => ({
        channelId,
        participants: Array.from(participants.values()),
      })),
    };
  }

  private broadcastOnlineUsers() {
    this.server.emit('presence:online', {
      onlineUserIds: Array.from(this.onlineUsers.keys()),
    });
  }

  @SubscribeMessage('voice:join')
  async joinVoice(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ) {
    const user = client.data.user as AuthPayload;
    const moderation = await this.getModerationState(body.channelId, user.sub);
    if (moderation.isBanned) {
      return { ok: false, reason: 'You are temporarily banned from this server' };
    }

    const room = this.voiceRoom(body.channelId);
    const participants = this.voiceRooms.get(body.channelId) ?? new Map<string, VoiceParticipant>();

    if (!participants.has(client.id) && participants.size >= 10) {
      return { ok: false, reason: 'Voice channel limit reached' };
    }

    participants.set(client.id, {
      socketId: client.id,
      userId: user.sub,
      username: user.username,
      muted: moderation.isMuted,
      deafened: moderation.isDeafened,
      speaking: false,
      pushToTalkActive: false,
      voiceActivationActive: !moderation.isMuted,
    });
    this.voiceRooms.set(body.channelId, participants);

    client.join(room);
    const payload = Array.from(participants.values());
    this.server.to(room).emit('voice:participants', payload);
    await this.auditService.log('voice.joined', { channelId: body.channelId }, user.sub);

    return { ok: true, participants: payload };
  }

  @SubscribeMessage('voice:leave')
  async leaveVoice(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ) {
    const user = client.data.user as AuthPayload;
    const participants = this.voiceRooms.get(body.channelId);
    if (!participants) {
      return { ok: true };
    }

    participants.delete(client.id);
    client.leave(this.voiceRoom(body.channelId));
    this.server.to(this.voiceRoom(body.channelId)).emit('voice:participants', Array.from(participants.values()));
    await this.auditService.log('voice.left', { channelId: body.channelId }, user.sub);

    return { ok: true };
  }

  @SubscribeMessage('voice:state')
  handleVoiceState(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      channelId: string;
      muted?: boolean;
      deafened?: boolean;
      speaking?: boolean;
      pushToTalkActive?: boolean;
      voiceActivationActive?: boolean;
    },
  ) {
    const user = client.data.user as AuthPayload;
    const participants = this.voiceRooms.get(body.channelId);
    if (!participants || !participants.has(client.id)) {
      return { ok: false };
    }

    const currentParticipant = participants.get(client.id)!;
    return this.applyVoiceState(body.channelId, user.sub).then((moderation) => {
      const next = {
        ...currentParticipant,
        muted: moderation.isMuted ? true : body.muted ?? currentParticipant.muted,
        deafened: moderation.isDeafened ? true : body.deafened ?? currentParticipant.deafened,
        speaking: moderation.isMuted ? false : body.speaking ?? currentParticipant.speaking,
        pushToTalkActive: moderation.isMuted ? false : body.pushToTalkActive ?? currentParticipant.pushToTalkActive,
        voiceActivationActive:
          moderation.isMuted ? false : body.voiceActivationActive ?? currentParticipant.voiceActivationActive,
      };

      participants.set(client.id, next);
      this.server.to(this.voiceRoom(body.channelId)).emit('voice:state', {
        userId: user.sub,
        channelId: body.channelId,
        state: next,
      });

      return { ok: true, state: next };
    });
  }

  @SubscribeMessage('screen-share:start')
  async startScreenShare(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string; sourceName: string; withSystemAudio: boolean },
  ) {
    const user = client.data.user as AuthPayload;
    const moderation = await this.getModerationState(body.channelId, user.sub);
    if (moderation.isBanned) {
      return { ok: false, reason: 'You are temporarily banned from this server' };
    }
    if (moderation.isScreenShareBlocked) {
      return { ok: false, reason: 'Screen sharing is disabled by the server' };
    }

    this.server.to(this.voiceRoom(body.channelId)).emit('screen-share:started', {
      channelId: body.channelId,
      userId: user.sub,
      username: user.username,
      sourceName: body.sourceName,
      withSystemAudio: body.withSystemAudio,
      startedAt: new Date().toISOString(),
    });

    await this.auditService.log(
      'screen-share.started',
      { channelId: body.channelId, sourceName: body.sourceName, withSystemAudio: body.withSystemAudio },
      user.sub,
    );

    return { ok: true };
  }

  @SubscribeMessage('screen-share:stop')
  async stopScreenShare(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ) {
    const user = client.data.user as AuthPayload;
    this.server.to(this.voiceRoom(body.channelId)).emit('screen-share:stopped', {
      channelId: body.channelId,
      userId: user.sub,
      stoppedAt: new Date().toISOString(),
    });

    await this.auditService.log('screen-share.stopped', { channelId: body.channelId }, user.sub);

    return { ok: true };
  }

  @SubscribeMessage('signal:sdp')
  handleSdp(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string; targetUserId?: string; targetSocketId?: string; description: unknown },
  ) {
    const user = client.data.user as AuthPayload;
    const targetSocketId =
      body.targetSocketId ?? (body.targetUserId ? this.findSocketIdByUserId(body.channelId, body.targetUserId) : null);
    if (!targetSocketId) {
      return { ok: false, reason: 'Target participant is not in the voice channel' };
    }

    this.server.to(targetSocketId).emit('signal:sdp', {
      fromUserId: user.sub,
      channelId: body.channelId,
      description: body.description,
    });

    return { ok: true };
  }

  @SubscribeMessage('signal:ice')
  handleIce(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string; targetUserId?: string; targetSocketId?: string; candidate: unknown },
  ) {
    const user = client.data.user as AuthPayload;
    const targetSocketId =
      body.targetSocketId ?? (body.targetUserId ? this.findSocketIdByUserId(body.channelId, body.targetUserId) : null);
    if (!targetSocketId) {
      return { ok: false, reason: 'Target participant is not in the voice channel' };
    }

    this.server.to(targetSocketId).emit('signal:ice', {
      fromUserId: user.sub,
      channelId: body.channelId,
      candidate: body.candidate,
    });

    return { ok: true };
  }

  @SubscribeMessage('metrics:update')
  handleMetrics(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string; rtt?: number; jitter?: number; packetLoss?: number; bitrate?: number },
  ) {
    const user = client.data.user as AuthPayload;
    const metrics: NetworkMetrics = {
      rtt: body.rtt,
      jitter: body.jitter,
      packetLoss: body.packetLoss,
      bitrate: body.bitrate,
      updatedAt: new Date().toISOString(),
    };

    this.metrics.set(client.id, metrics);
    this.server.to(this.voiceRoom(body.channelId)).emit('metrics:updated', {
      userId: user.sub,
      channelId: body.channelId,
      metrics,
    });

    return { ok: true, metrics };
  }

  private extractToken(client: Socket) {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      return authorization.slice(7);
    }

    this.logger.warn(`Socket ${client.id} connected without token`);
    return null;
  }

  private voiceRoom(channelId: string) {
    return `voice:${channelId}`;
  }

  private findSocketIdByUserId(channelId: string, userId: string) {
    const participants = this.voiceRooms.get(channelId);
    if (!participants) {
      return null;
    }

    for (const [socketId, participant] of participants.entries()) {
      if (participant.userId === userId) {
        return socketId;
      }
    }

    return null;
  }

  private async applyVoiceState(channelId: string, userId: string) {
    return this.getModerationState(channelId, userId);
  }

  private async getModerationState(channelId: string, userId: string) {
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
      select: { id: true, serverId: true },
    });

    if (!channel) {
      throw new ForbiddenException('Channel not found');
    }

    const membership = await this.membersRepository.findOne({
      where: { serverId: channel.serverId, userId },
    });

    const now = Date.now();
    const isActive = (value?: Date | null) => Boolean(value && new Date(value).getTime() > now);

    return {
      isBanned: isActive(membership?.bannedUntil),
      isMuted: isActive(membership?.mutedUntil),
      isDeafened: isActive(membership?.deafenedUntil),
      isScreenShareBlocked: isActive(membership?.screenShareBlockedUntil),
    };
  }
}
