import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ContentPipelineService {
  constructor(private prisma: PrismaService) {}

  async ingestRaw(data: any) {
    const duplicateHash = crypto
      .createHash('sha256')
      .update((data.rawTitle + data.rawText + (data.sourceUrl || '')).toLowerCase().replace(/\s+/g, ''))
      .digest('hex');

    const existing = await this.prisma.contentItem.findUnique({ where: { duplicateHash } });
    if (existing) return null;

    let riskScore = 0;
    const text = (data.rawTitle + ' ' + data.rawText).toLowerCase();
    if (/чп|теракт|взрыв|погиб/.test(text)) riskScore += 30;
    if (/политика|санкц|мобилизац/.test(text)) riskScore += 20;

    const status = riskScore >= 30 ? 'MANUAL_REVIEW' : 'APPROVED';

    return this.prisma.contentItem.create({
      data: {
        channelId: data.channelId,
        sourceId: data.sourceId,
        type: 'NEWS',
        rawTitle: data.rawTitle,
        rawText: data.rawText,
        sourceUrl: data.sourceUrl,
        duplicateHash,
        riskScore,
        status,
        factCheckStatus: 'PENDING',
      },
    });
  }
}
