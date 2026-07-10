import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { promises as fs } from 'fs';
import { join } from 'path';
import { StoredFileRef } from './storage.interface';

@Injectable()
export class StorageService {
  private baseDir = process.env.STORAGE_DIR || '/tmp/svoy_storage';
  private driver = process.env.STORAGE_DRIVER || 'local';

  ensureDir(subdir = '') {
    const dir = join(this.baseDir, subdir);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  saveTextFile(subdir: string, filename: string, content: string) {
    const dir = this.ensureDir(subdir);
    const path = join(dir, filename);
    writeFileSync(path, content, 'utf8');
    return path;
  }

  async saveBinaryFile(subdir: string, filename: string, data: Buffer): Promise<string> {
    if (this.driver === 's3') {
      return this.saveBinaryFileS3(subdir, filename, data);
    }
    const dir = this.ensureDir(subdir);
    const path = join(dir, filename);
    await fs.writeFile(path, data);
    return path;
  }

  async saveBinaryFileS3(subdir: string, filename: string, _data: Buffer): Promise<string> {
    return `s3://${process.env.S3_BUCKET || 'svoy'}/${subdir}/${filename}`;
  }

  toPublicUrl(path: string): string {
    if (path.startsWith('s3://')) return path;
    return `/storage/${path.replace(this.baseDir, '').replace(/^\/+/, '')}`;
  }

  toFileRef(path: string): StoredFileRef {
    return {
      storageKey: path,
      localPath: path.startsWith('s3://') ? undefined : path,
      publicUrl: this.toPublicUrl(path),
    };
  }
}
