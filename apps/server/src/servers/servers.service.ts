import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service';
import { UserEntity } from '../users/user.entity';
import { CreateServerDto } from './dto/create-server.dto';
import { ServerMemberEntity } from './server-member.entity';
import { isActiveRestriction, serializeServerMember, sortServerMembers } from './server-member.presenter';
import { ServerEntity } from './server.entity';

type UpdateServerDto = {
  name?: string;
  description?: string | null;
};

type ModerateMemberDto = {
  action:
    | 'mute'
    | 'deafen'
    | 'block_share'
    | 'ban'
    | 'clear_mute'
    | 'clear_deafen'
    | 'clear_block_share'
    | 'clear_ban';
  durationMinutes?: number;
};

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(ServerEntity)
    private readonly serversRepository: Repository<ServerEntity>,
    @InjectRepository(ServerMemberEntity)
    private readonly membersRepository: Repository<ServerMemberEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateServerDto, userId: string) {
    const owner = await this.usersRepository.findOne({ where: { id: userId } });
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    const server = await this.serversRepository.save(
      this.serversRepository.create({
        name: dto.name,
        description: dto.description ?? null,
        owner,
        ownerId: owner.id,
      }),
    );

    await this.membersRepository.save(
      this.membersRepository.create({
        server,
        serverId: server.id,
        user: owner,
        userId: owner.id,
        role: 'owner',
      }),
    );

    await this.auditService.log('server.created', { serverId: server.id, name: server.name }, userId);

    return this.findOneForUser(server.id, userId);
  }

  async listForUser(userId: string) {
    const servers = await this.serversRepository.find({
      relations: {
        channels: true,
        members: true,
        owner: true,
      },
      order: { createdAt: 'DESC' },
    });

    return servers
      .filter((server) =>
        server.members.some((member) => member.userId === userId && !isActiveRestriction(member.bannedUntil)),
      )
      .map((server) => this.serializeServer(server, userId));
  }

  async findOneForUser(serverId: string, userId: string) {
    const server = await this.serversRepository.findOne({
      where: { id: serverId },
      relations: {
        channels: true,
        members: true,
        owner: true,
      },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    const membership = server.members.find((member) => member.userId === userId);
    if (!membership) {
      throw new ForbiddenException('Access denied');
    }
    if (isActiveRestriction(membership.bannedUntil)) {
      throw new ForbiddenException('You are temporarily banned from this server');
    }

    return this.serializeServer(server, userId);
  }

  async join(serverId: string, userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const server = await this.serversRepository.findOne({
      where: { id: serverId },
      relations: {
        members: true,
      },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    const existingMembership = server.members.find((member) => member.userId === userId);
    if (existingMembership && isActiveRestriction(existingMembership.bannedUntil)) {
      throw new ForbiddenException('You are temporarily banned from this server');
    }

    const isMember = server.members.some((member) => member.userId === userId);
    if (!isMember) {
      await this.membersRepository.save(
        this.membersRepository.create({
          server,
          serverId: server.id,
          user,
          userId: user.id,
          role: 'member',
        }),
      );

      await this.auditService.log('server.joined', { serverId: server.id }, userId);
    }

    return this.findOneForUser(server.id, userId);
  }

  async update(serverId: string, dto: UpdateServerDto, userId: string) {
    const server = await this.requireServer(serverId);
    const membership = await this.requireManagementMembership(serverId, userId);

    server.name = dto.name?.trim() || server.name;
    server.description = dto.description === undefined ? server.description : dto.description?.trim() || null;
    await this.serversRepository.save(server);

    await this.auditService.log(
      'server.updated',
      { serverId: server.id, role: membership.role, name: server.name },
      userId,
    );

    return this.findOneForUser(server.id, userId);
  }

  async listMembers(serverId: string, userId: string) {
    const server = await this.serversRepository.findOne({
      where: { id: serverId },
      relations: {
        owner: true,
        members: {
          user: true,
        },
      },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    const membership = server.members.find((member) => member.userId === userId);
    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    return server.members
      .sort(sortServerMembers)
      .map((member) => serializeServerMember(member, server.ownerId));
  }

  async removeMember(serverId: string, memberUserId: string, actorUserId: string) {
    await this.requireManagementMembership(serverId, actorUserId);

    const server = await this.requireServer(serverId);
    if (memberUserId === server.ownerId) {
      throw new ForbiddenException('The server owner cannot be removed');
    }

    const membership = await this.membersRepository.findOne({
      where: { serverId, userId: memberUserId },
    });

    if (!membership) {
      throw new NotFoundException('Server member not found');
    }

    await this.membersRepository.remove(membership);
    await this.auditService.log('server.member_removed', { serverId, memberUserId }, actorUserId);

    return { ok: true };
  }

  async moderateMember(serverId: string, memberUserId: string, dto: ModerateMemberDto, actorUserId: string) {
    await this.requireManagementMembership(serverId, actorUserId);

    const server = await this.requireServer(serverId);
    if (memberUserId === server.ownerId) {
      throw new ForbiddenException('The server owner cannot be moderated');
    }

    const membership = await this.membersRepository.findOne({
      where: { serverId, userId: memberUserId },
      relations: { user: true },
    });

    if (!membership) {
      throw new NotFoundException('Server member not found');
    }

    const until = dto.durationMinutes ? new Date(Date.now() + dto.durationMinutes * 60_000) : null;

    switch (dto.action) {
      case 'mute':
        membership.mutedUntil = until;
        break;
      case 'deafen':
        membership.deafenedUntil = until;
        break;
      case 'block_share':
        membership.screenShareBlockedUntil = until;
        break;
      case 'ban':
        membership.bannedUntil = until;
        break;
      case 'clear_mute':
        membership.mutedUntil = null;
        break;
      case 'clear_deafen':
        membership.deafenedUntil = null;
        break;
      case 'clear_block_share':
        membership.screenShareBlockedUntil = null;
        break;
      case 'clear_ban':
        membership.bannedUntil = null;
        break;
      default:
        throw new ForbiddenException('Unknown moderation action');
    }

    await this.membersRepository.save(membership);
    await this.auditService.log(
      'server.member_moderated',
      { serverId, memberUserId, action: dto.action, durationMinutes: dto.durationMinutes ?? null },
      actorUserId,
    );

    return {
      ok: true,
      member: serializeServerMember(membership, server.ownerId),
    };
  }

  private async requireServer(serverId: string) {
    const server = await this.serversRepository.findOne({ where: { id: serverId } });
    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return server;
  }

  private async requireManagementMembership(serverId: string, userId: string) {
    const membership = await this.membersRepository.findOne({
      where: { serverId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      throw new ForbiddenException('Only server owner or admin can manage this server');
    }

    return membership;
  }

  private serializeServer(server: ServerEntity, userId: string) {
    const membership = server.members.find((member) => member.userId === userId);

    return {
      id: server.id,
      name: server.name,
      description: server.description,
      ownerId: server.ownerId,
      owner: server.owner
        ? {
            id: server.owner.id,
            username: server.owner.username,
            displayName: server.owner.displayName,
          }
        : null,
      currentUserRole: membership?.role ?? 'member',
      memberCount: server.members.length,
      channels: server.channels,
      createdAt: server.createdAt,
      updatedAt: server.updatedAt,
    };
  }

}
