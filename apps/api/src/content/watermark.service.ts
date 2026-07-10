import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { basename, extname, join } from 'path';
import sharp from 'sharp';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { StorageService } from '../storage/storage.service';

const execFileAsync = promisify(execFile);

@Injectable()
export class WatermarkService {
  constructor(private readonly storage: StorageService) {}

  async processImage(localPath: string, watermarkText: string) {
    if (!existsSync(localPath)) return null;
    const image = sharp(localPath);
    const meta = await image.metadata();
    const width = meta.width || 1200;
    const height = meta.height || 1200;
    const fontSize = Math.max(22, Math.round(width * 0.035));
    const padding = Math.max(24, Math.round(width * 0.025));
    const svg = Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect x="${padding}" y="${height - fontSize - padding * 1.8}" rx="14" ry="14" width="${Math.max(220, watermarkText.length * fontSize * 0.72)}" height="${fontSize + 26}" fill="rgba(0,0,0,0.45)" />
        <text x="${padding + 18}" y="${height - padding}" font-size="${fontSize}" fill="white" font-family="Arial, sans-serif" font-weight="700">${escapeXml(watermarkText)}</text>
      </svg>
    `);
    const outDir = this.storage.ensureDir('processed');
    const outPath = join(outDir, `${basename(localPath, extname(localPath))}-wm.jpg`);
    await image.composite([{ input: svg, top: 0, left: 0 }]).jpeg({ quality: 92 }).toFile(outPath);
    return { outPath, watermarkText };
  }

  async processVideo(localPath: string, watermarkText: string) {
    if (!existsSync(localPath)) return null;
    const outDir = this.storage.ensureDir('processed');
    const outPath = join(outDir, `${basename(localPath, extname(localPath))}-wm.mp4`);
    const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
    const filter = `drawbox=x=20:y=h-80:w=260:h=50:color=black@0.45:t=fill,drawtext=text='${escapeFfmpeg(watermarkText)}':fontcolor=white:fontsize=24:x=36:y=h-48`;
    try {
      await execFileAsync(ffmpeg, ['-y', '-i', localPath, '-vf', filter, '-codec:a', 'copy', outPath]);
      return { outPath, watermarkText };
    } catch {
      return { outPath: localPath, watermarkText, fallback: true };
    }
  }
}

function escapeXml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function escapeFfmpeg(text: string) {
  return text.replace(/:/g, '\\:').replace(/'/g, "\\'");
}
