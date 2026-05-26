import { ForbiddenException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service';
import { ServerMemberEntity } from '../servers/server-member.entity';
import { ServerEntity } from '../servers/server.entity';
import { UserEntity } from '../users/user.entity';
import { ChannelEntity, ChannelType } from './channel.entity';
import { AccessChannelDto } from './dto/access-channel.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { TextMessageEntity } from './text-message.entity';

@Injectable()
export class ChannelsService {
  private readonly privateChannelAccess = new Map<string, string>();

  constructor(
    @InjectRepository(ChannelEntity)
    private readonly channelsRepository: Repository<ChannelEntity>,
    @InjectRepository(TextMessageEntity)
    private readonly messagesRepository: Repository<TextMessageEntity>,
    @InjectRepository(ServerEntity)
    private readonly serversRepository: Repository<ServerEntity>,
    @InjectRepository(ServerMemberEntity)
    private readonly membersRepository: Repository<ServerMemberEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly auditService: AuditService,
  ) {}

  async listForServer(serverId: string, userId: string) {
    await this.ensureMembership(serverId, userId);

    return this.channelsRepository.find({
      where: { serverId },
      order: { createdAt: 'ASC' },
    });
  }

  async create(serverId: string, dto: CreateChannelDto, userId: string) {
    await this.ensureOwnerMembership(serverId, userId);

    const server = await this.serversRepository.findOne({ where: { id: serverId } });
    if (!server) {
      throw new NotFoundException('Server not found');
    }

    const creator = await this.usersRepository.findOne({ where: { id: userId } });
    if (!creator) {
      throw new NotFoundException('User not found');
    }

    const channel = await this.channelsRepository.save(
      this.channelsRepository.create({
        name: dto.name,
        type: dto.type,
        isPrivate: dto.isPrivate ?? false,
        passwordHash: dto.isPrivate && dto.password ? await bcrypt.hash(dto.password, 10) : null,
        server,
        serverId: server.id,
        createdBy: creator,
        createdById: creator.id,
      }),
    );

    await this.auditService.log(
      'channel.created',
      { channelId: channel.id, serverId, type: channel.type, isPrivate: channel.isPrivate },
      userId,
    );

    return channel;
  }

  async remove(serverId: string, channelId: string, userId: string) {
    await this.ensureOwnerMembership(serverId, userId);

    const channel = await this.channelsRepository.findOne({
      where: { id: channelId, serverId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await this.channelsRepository.remove(channel);
    await this.auditService.log('channel.removed', { channelId, serverId }, userId);

    return { ok: true };
  }

  async update(serverId: string, channelId: string, dto: UpdateChannelDto, userId: string) {
    await this.ensureOwnerMembership(serverId, userId);

    const channel = await this.channelsRepository.findOne({
      where: { id: channelId, serverId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (dto.name !== undefined) {
      channel.name = dto.name;
    }

    if (dto.isPrivate !== undefined) {
      channel.isPrivate = dto.isPrivate;
    }

    if (dto.isPrivate === false) {
      channel.passwordHash = null;
    } else if (dto.password) {
      channel.passwordHash = await bcrypt.hash(dto.password, 10);
      channel.isPrivate = true;
    }

    const saved = await this.channelsRepository.save(channel);
    await this.auditService.log('channel.updated', { channelId, serverId, isPrivate: saved.isPrivate }, userId);

    return saved;
  }

  async listMessages(serverId: string, channelId: string, userId: string) {
    const membership = await this.ensureMembership(serverId, userId);

    const channel = await this.channelsRepository.findOne({ where: { id: channelId, serverId } });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    if (channel.type !== ChannelType.TEXT) {
      throw new ForbiddenException('Only text channels support messages');
    }
    this.ensureChannelAccess(channel, membership);

    return this.messagesRepository.find({
      where: { channelId },
      relations: { author: true },
      order: { createdAt: 'ASC' },
      take: 100,
    });
  }

  async sendMessage(serverId: string, channelId: string, dto: CreateMessageDto, userId: string) {
    const membership = await this.ensureMembership(serverId, userId);

    const channel = await this.channelsRepository.findOne({ where: { id: channelId, serverId } });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    if (channel.type !== ChannelType.TEXT) {
      throw new ForbiddenException('Only text channels support messages');
    }
    this.ensureChannelAccess(channel, membership);

    const author = await this.usersRepository.findOne({ where: { id: userId } });
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    const message = await this.messagesRepository.save(
      this.messagesRepository.create({
        content: dto.content,
        channel,
        channelId,
        author,
        authorId: author.id,
      }),
    );

    await this.auditService.log('message.sent', { channelId, serverId, messageId: message.id }, userId);

    return this.messagesRepository.findOne({
      where: { id: message.id },
      relations: { author: true },
    });
  }

  async access(serverId: string, channelId: string, dto: AccessChannelDto, userId: string) {
    const membership = await this.ensureMembership(serverId, userId);
    const channel = await this.channelsRepository.findOne({ where: { id: channelId, serverId } });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (!channel.isPrivate) {
      return { ok: true };
    }

    if (membership.role === 'owner') {
      this.privateChannelAccess.delete(this.accessKey(serverId, channelId, userId));
      return { ok: true };
    }

    const passwordMatches =
      Boolean(dto.password) &&
      Boolean(channel.passwordHash) &&
      (await bcrypt.compare(dto.password as string, channel.passwordHash as string));

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid channel password');
    }

    if (channel.passwordHash) {
      this.privateChannelAccess.set(this.accessKey(serverId, channelId, userId), channel.passwordHash);
    }

    return { ok: true };
  }

  private async ensureMembership(serverId: string, userId: string) {
    const membership = await this.membersRepository.findOne({
      where: { serverId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this server');
    }

    return membership;
  }

  private async ensureOwnerMembership(serverId: string, userId: string) {
    const membership = await this.ensureMembership(serverId, userId);
    if (membership.role !== 'owner') {
      throw new ForbiddenException('Only server owner can manage channels');
    }

    return membership;
  }

  private accessKey(serverId: string, channelId: string, userId: string) {
    return `${serverId}:${channelId}:${userId}`;
  }

  private ensureChannelAccess(channel: ChannelEntity, membership: ServerMemberEntity) {
    if (!channel.isPrivate || membership.role === 'owner') {
      return;
    }

    const grantedHash = this.privateChannelAccess.get(this.accessKey(channel.serverId, channel.id, membership.userId));
    if (!grantedHash || !channel.passwordHash || grantedHash !== channel.passwordHash) {
      throw new UnauthorizedException('Invalid channel password');
    }
  }
}
