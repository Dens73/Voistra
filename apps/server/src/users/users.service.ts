import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { UserEntity } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  create(data: Partial<UserEntity>) {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  findByUsername(username: string) {
    return this.usersRepository.findOne({ where: { username } });
  }

  findById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async search(query: string, currentUserId: string) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    const users = await this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) LIKE :query OR LOWER(user.displayName) LIKE :query', {
        query: `%${normalized}%`,
      })
      .andWhere('user.id != :currentUserId', { currentUserId })
      .orderBy('user.displayName', 'ASC')
      .limit(12)
      .getMany();

    return users.map((user) => this.serializeUser(user));
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.newPassword && !dto.currentPassword) {
      throw new BadRequestException('Current password is required');
    }

    if (dto.currentPassword && dto.newPassword) {
      const passwordMatches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!passwordMatches) {
        throw new UnauthorizedException('Current password is invalid');
      }

      user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    }

    if (dto.displayName !== undefined) {
      user.displayName = dto.displayName;
    }
    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl || null;
    }
    if (dto.bio !== undefined) {
      user.bio = dto.bio || null;
    }
    if (dto.reconnectEnabled !== undefined) {
      user.reconnectEnabled = dto.reconnectEnabled;
    }
    if (dto.pushToTalkEnabled !== undefined) {
      user.pushToTalkEnabled = dto.pushToTalkEnabled;
    }
    if (dto.voiceActivationEnabled !== undefined) {
      user.voiceActivationEnabled = dto.voiceActivationEnabled;
    }
    if (dto.noiseSuppressionEnabled !== undefined) {
      user.noiseSuppressionEnabled = dto.noiseSuppressionEnabled;
    }
    if (dto.echoCancellationEnabled !== undefined) {
      user.echoCancellationEnabled = dto.echoCancellationEnabled;
    }
    if (dto.autoGainControlEnabled !== undefined) {
      user.autoGainControlEnabled = dto.autoGainControlEnabled;
    }

    const saved = await this.usersRepository.save(user);
    return this.serializeUser(saved);
  }

  serializeUser(user: UserEntity) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      reconnectEnabled: user.reconnectEnabled,
      pushToTalkEnabled: user.pushToTalkEnabled,
      voiceActivationEnabled: user.voiceActivationEnabled,
      noiseSuppressionEnabled: user.noiseSuppressionEnabled,
      echoCancellationEnabled: user.echoCancellationEnabled,
      autoGainControlEnabled: user.autoGainControlEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
