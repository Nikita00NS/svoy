import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(page = 1, limit = 20, q?: string) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: null, ...(q ? { OR: [{ username: { contains: q, mode: 'insensitive' as const } }] } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async update(id: string, data: { role?: UserRole; isActive?: boolean }) {
    const user = await this.prisma.user.update({ where: { id }, data });
    await this.audit.log({ action: 'USER_UPDATE', entityType: 'User', entityId: id, payloadJson: data });
    return user;
  }

  async softDelete(id: string) {
    const user = await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await this.audit.log({ action: 'USER_SOFT_DELETE', entityType: 'User', entityId: id });
    return user;
  }
}
