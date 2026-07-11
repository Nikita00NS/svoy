import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(page = 1, limit = 20, q?: string) {
    try {
      const skip = (page - 1) * limit;
      const where = { deletedAt: null, ...(q ? { OR: [{ username: { contains: q, mode: 'insensitive' as const } }] } : {}) } as any;
      const [items, total] = await Promise.all([
        this.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        this.prisma.user.count({ where }),
      ]);
      return { items, total, page, limit };
    } catch (e: any) {
      this.logger.error(`list failed: ${e.message}`);
      return { items: [], total: 0, page, limit };
    }
  }

  async update(id: string, data: { role?: UserRole; isActive?: boolean }) {
    try {
      const user = await this.prisma.user.update({ where: { id }, data });
      await this.audit.log({ action: 'USER_UPDATE', entityType: 'User', entityId: id, payloadJson: data }).catch(()=>{});
      return user;
    } catch (e: any) {
      this.logger.error(`update failed: ${e.message}`);
      throw new BadRequestException(`Ошибка обновления: ${e.message}`);
    }
  }

  async softDelete(id: string) {
    try {
      const user = await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
      await this.audit.log({ action: 'USER_SOFT_DELETE', entityType: 'User', entityId: id }).catch(()=>{});
      return user;
    } catch (e: any) {
      throw new BadRequestException(`Ошибка удаления: ${e.message}`);
    }
  }
}
