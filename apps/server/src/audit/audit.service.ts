import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLogEntity } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepository: Repository<AuditLogEntity>,
  ) {}

  async log(action: string, details?: Record<string, unknown>, userId?: string) {
    const record = this.auditRepository.create({
      action,
      details: details ?? null,
      userId: userId ?? null,
    });

    return this.auditRepository.save(record);
  }

  async latest(limit = 50) {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
