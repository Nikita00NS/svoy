import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);
  private readonly connection = process.env.REDIS_URL ? { connection: { url: process.env.REDIS_URL } as any } : null;

  getQueue(name: string) {
    if (!this.connection) return null;
    return new Queue(name, this.connection as any);
  }

  async enqueue(name: string, jobName: string, payload: unknown, delay = 0) {
    const queue = this.getQueue(name);
    if (!queue) {
      this.logger.warn(`Queue ${name} skipped: REDIS_URL not configured`);
      return null;
    }
    return queue.add(jobName, payload as any, { delay, attempts: 3, backoff: { type: 'fixed', delay: 30000 } });
  }
}
