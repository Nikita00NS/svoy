import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import FormData from 'form-data';
import { createReadStream, existsSync } from 'fs';

const prisma = new PrismaClient();
const token = process.env.MASTER_BOT_TOKEN;

async function sendMessage(chatId: string, text: string) {
  const { data } = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text });
  return data?.result;
}

async function sendPhoto(chatId: string, photo: string, caption?: string) {
  if (existsSync(photo)) {
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('caption', caption || '');
    form.append('photo', createReadStream(photo));
    const { data } = await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, form, { headers: form.getHeaders() });
    return data?.result;
  }
  const { data } = await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo, caption });
  return data?.result;
}

async function sendVideo(chatId: string, video: string, caption?: string) {
  if (existsSync(video)) {
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('caption', caption || '');
    form.append('video', createReadStream(video));
    const { data } = await axios.post(`https://api.telegram.org/bot${token}/sendVideo`, form, { headers: form.getHeaders() });
    return data?.result;
  }
  const { data } = await axios.post(`https://api.telegram.org/bot${token}/sendVideo`, { chat_id: chatId, video, caption });
  return data?.result;
}

async function publishOne(item: any) {
  if (!item.channel?.telegramId) throw new Error('Channel telegramId missing');
  const chatId = item.channel.telegramId.toString();
  const text = item.aiRewrittenText || item.body || item.title || 'СВОЙ';

  if (item.mediaType === 'PHOTO') {
    return sendPhoto(chatId, item.processedMediaPath || item.localMediaPath || item.mediaFileId || '', text);
  }
  if (item.mediaType === 'VIDEO') {
    return sendVideo(chatId, item.processedMediaPath || item.localMediaPath || item.mediaFileId || '', text);
  }
  return sendMessage(chatId, text);
}

async function publishScheduled() {
  const items = await prisma.contentItem.findMany({
    where: { status: 'SCHEDULED', scheduledFor: { lte: new Date() } },
    include: { channel: true },
  });

  for (const item of items) {
    try {
      const result = await publishOne(item);
      await prisma.contentItem.update({
        where: { id: item.id },
        data: {
          status: 'PUBLISHED',
          publishedMessageId: result?.message_id ? BigInt(result.message_id) : undefined,
        },
      });
    } catch (error: any) {
      console.error('Publish error', item.id, error?.message || error);
      const postponed = new Date(Date.now() + 5 * 60 * 1000);
      await prisma.contentItem.update({
        where: { id: item.id },
        data: {
          scheduledFor: postponed,
        },
      });
    }
  }
}

async function run() {
  setInterval(async () => {
    try {
      if (!token) return;
      await publishScheduled();
    } catch (error) {
      console.error('Worker loop error', error);
    }
  }, 30000);
}

run();
