import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { UserEntity } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { DirectConversationEntity } from './direct-conversation.entity';
import { DirectMessageEntity } from './direct-message.entity';
import { FriendRequestEntity } from './friend-request.entity';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(FriendRequestEntity)
    private readonly requestsRepository: Repository<FriendRequestEntity>,
    @InjectRepository(DirectConversationEntity)
    private readonly conversationsRepository: Repository<DirectConversationEntity>,
    @InjectRepository(DirectMessageEntity)
    private readonly directMessagesRepository: Repository<DirectMessageEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    private readonly realtimeEvents: RealtimeEventsService,
  ) {}

  async listFriends(userId: string) {
    const accepted = await this.requestsRepository.find({
      where: [{ requesterId: userId, status: 'accepted' }, { recipientId: userId, status: 'accepted' }],
      relations: ['requester', 'recipient'],
      order: { updatedAt: 'DESC' },
    });

    return accepted.map((request) => {
      const friend = request.requesterId === userId ? request.recipient : request.requester;
      return {
        ...this.usersService.serializeUser(friend),
        connectedAt: request.updatedAt,
      };
    });
  }

  async listPending(userId: string) {
    const requests = await this.requestsRepository.find({
      where: [{ requesterId: userId, status: 'pending' }, { recipientId: userId, status: 'pending' }],
      relations: ['requester', 'recipient'],
      order: { createdAt: 'DESC' },
    });

    return requests.map((request) => ({
      id: request.id,
      direction: request.requesterId === userId ? 'outgoing' : 'incoming',
      status: request.status,
      createdAt: request.createdAt,
      requester: this.usersService.serializeUser(request.requester),
      recipient: this.usersService.serializeUser(request.recipient),
    }));
  }

  async sendFriendRequest(userId: string, dto: SendFriendRequestDto) {
    const target = await this.usersRepository.findOne({
      where: UUID_PATTERN.test(dto.target)
        ? [{ id: dto.target }, { username: dto.target }]
        : { username: dto.target },
    });
    if (!target) {
      throw new NotFoundException('Target user not found');
    }
    if (target.id === userId) {
      throw new BadRequestException('You cannot add yourself');
    }

    const existing = await this.requestsRepository.findOne({
      where: [
        { requesterId: userId, recipientId: target.id },
        { requesterId: target.id, recipientId: userId },
      ],
      relations: ['requester', 'recipient'],
    });

    if (existing?.status === 'accepted') {
      throw new ConflictException('Friend already exists');
    }
    if (existing?.status === 'pending') {
      if (existing.requesterId === target.id && existing.recipientId === userId) {
        existing.status = 'accepted';
        const accepted = await this.requestsRepository.save(existing);
        await this.auditService.log('friend.accepted.auto', { requestId: accepted.id, friendUserId: target.id }, userId);
        return {
          id: accepted.id,
          status: accepted.status,
          requester: this.usersService.serializeUser(accepted.requester),
          recipient: this.usersService.serializeUser(accepted.recipient),
        };
      }

      throw new ConflictException('Request already pending');
    }

    const request = await this.requestsRepository.save(
      this.requestsRepository.create({
        requesterId: userId,
        recipientId: target.id,
        status: 'pending',
      }),
    );
    await this.auditService.log('friend.requested', { requestId: request.id, friendUserId: target.id }, userId);
    return request;
  }

  async acceptFriendRequest(requestId: string, userId: string) {
    const request = await this.requestsRepository.findOne({
      where: { id: requestId },
      relations: ['requester', 'recipient'],
    });
    if (!request) {
      throw new NotFoundException('Friend request not found');
    }
    if (request.recipientId !== userId) {
      throw new ForbiddenException('Only recipient can accept this request');
    }
    request.status = 'accepted';
    const saved = await this.requestsRepository.save(request);
    await this.auditService.log('friend.accepted', { requestId, friendUserId: saved.requesterId }, userId);
    return {
      id: saved.id,
      status: saved.status,
      requester: this.usersService.serializeUser(saved.requester),
      recipient: this.usersService.serializeUser(saved.recipient),
    };
  }

  async removeFriend(userId: string, friendUserId: string) {
    const request = await this.requestsRepository.findOne({
      where: [
        { requesterId: userId, recipientId: friendUserId, status: 'accepted' },
        { requesterId: friendUserId, recipientId: userId, status: 'accepted' },
      ],
    });
    if (!request) {
      throw new NotFoundException('Friendship not found');
    }

    await this.requestsRepository.remove(request);
    await this.auditService.log('friend.removed', { friendUserId }, userId);
    return { ok: true };
  }

  async listConversations(userId: string) {
    const conversations = await this.conversationsRepository.find({
      where: [{ participantAId: userId }, { participantBId: userId }],
      order: { updatedAt: 'DESC' },
    });

    const result = [];
    for (const conversation of conversations) {
      const otherUserId = conversation.participantAId === userId ? conversation.participantBId : conversation.participantAId;
      const otherUser = await this.usersRepository.findOne({ where: { id: otherUserId } });
      const lastMessage = await this.directMessagesRepository.findOne({
        where: { conversationId: conversation.id },
        relations: ['author'],
        order: { createdAt: 'DESC' },
      });

      result.push({
        id: conversation.id,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        participant: otherUser ? this.usersService.serializeUser(otherUser) : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              author: lastMessage.author ? this.usersService.serializeUser(lastMessage.author) : null,
            }
          : null,
      });
    }

    return result;
  }

  async ensureConversation(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('Conversation with yourself is not supported');
    }

    const otherUser = await this.usersRepository.findOne({ where: { id: otherUserId } });
    if (!otherUser) {
      throw new NotFoundException('User not found');
    }

    const [participantAId, participantBId] = [userId, otherUserId].sort();
    let conversation = await this.conversationsRepository.findOne({
      where: { participantAId, participantBId },
    });

    if (!conversation) {
      conversation = await this.conversationsRepository.save(
        this.conversationsRepository.create({ participantAId, participantBId }),
      );
      await this.auditService.log('direct.created', { conversationId: conversation.id, otherUserId }, userId);
    }

    return {
      id: conversation.id,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participant: this.usersService.serializeUser(otherUser),
    };
  }

  async listMessages(conversationId: string, userId: string) {
    await this.ensureParticipant(conversationId, userId);
    const messages = await this.directMessagesRepository.find({
      where: { conversationId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });

    return messages.map((message) => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      author: message.author ? this.usersService.serializeUser(message.author) : null,
    }));
  }

  async sendMessage(conversationId: string, dto: SendDirectMessageDto, userId: string) {
    const conversation = await this.ensureParticipant(conversationId, userId);

    const message = await this.directMessagesRepository.save(
      this.directMessagesRepository.create({
        conversationId,
        authorId: userId,
        content: dto.content,
      }),
    );

    await this.conversationsRepository.update({ id: conversationId }, { updatedAt: new Date() });
    await this.auditService.log('direct.sent', { conversationId, messageId: message.id }, userId);

    const savedMessage = await this.directMessagesRepository.findOne({
      where: { id: message.id },
      relations: ['author'],
    });

    const serializedMessage = savedMessage
      ? {
          id: savedMessage.id,
          content: savedMessage.content,
          createdAt: savedMessage.createdAt,
          author: savedMessage.author ? this.usersService.serializeUser(savedMessage.author) : null,
        }
      : null;

    if (serializedMessage) {
      const participantIds = [conversation.participantAId, conversation.participantBId];
      for (const participantId of participantIds) {
        this.realtimeEvents.emitToUser(participantId, 'direct:message', {
          conversationId,
          message: serializedMessage,
        });
      }
    }

    return savedMessage;
  }

  private async ensureParticipant(conversationId: string, userId: string) {
    const conversation = await this.conversationsRepository.findOne({ where: { id: conversationId } });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (conversation.participantAId !== userId && conversation.participantBId !== userId) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    return conversation;
  }
}
