import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: { actorUserId?: string; action: string; entityType: string; entityId?: string; payloadJson?: any }) {
    return this.prisma.auditLog.create({ data });
  }

  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({ include: { actorUser: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, page, limit };
  }
}
