import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TelegramApiService {
  private readonly logger = new Logger(TelegramApiService.name);

  private getToken() {
    if (!process.env.MASTER_BOT_TOKEN) throw new Error('MASTER_BOT_TOKEN missing');
    return process.env.MASTER_BOT_TOKEN;
  }

  private baseUrl() {
    return `https://api.telegram.org/bot${this.getToken()}`;
  }

  private fileBaseUrl() {
    return `https://api.telegram.org/file/bot${this.getToken()}`;
  }

  async sendMessage(chatId: string | number | bigint, text: string, replyMarkup?: unknown) {
    const res = await axios.post(`${this.baseUrl()}/sendMessage`, { chat_id: chatId.toString(), text, reply_markup: replyMarkup });
    return res.data?.result;
  }

  async sendPhoto(chatId: string | number | bigint, photo: string, caption?: string, replyMarkup?: unknown) {
    const res = await axios.post(`${this.baseUrl()}/sendPhoto`, { chat_id: chatId.toString(), photo, caption, reply_markup: replyMarkup });
    return res.data?.result;
  }

  async sendVideo(chatId: string | number | bigint, video: string, caption?: string, replyMarkup?: unknown) {
    const res = await axios.post(`${this.baseUrl()}/sendVideo`, { chat_id: chatId.toString(), video, caption, reply_markup: replyMarkup });
    return res.data?.result;
  }

  async sendDocument(chatId: string | number | bigint, document: string, caption?: string) {
    const res = await axios.post(`${this.baseUrl()}/sendDocument`, { chat_id: chatId.toString(), document, caption });
    return res.data?.result;
  }

  async sendPoll(chatId: string | number | bigint, question: string, options: string[], isAnonymous = true, allowsMultiple = false) {
    const res = await axios.post(`${this.baseUrl()}/sendPoll`, {
      chat_id: chatId.toString(),
      question,
      options,
      is_anonymous: isAnonymous,
      allows_multiple_answers: allowsMultiple,
    });
    return res.data?.result;
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string) {
    const res = await axios.post(`${this.baseUrl()}/answerCallbackQuery`, { callback_query_id: callbackQueryId, text });
    return res.data?.result;
  }

  async deleteMessage(chatId: string | number | bigint, messageId: number) {
    const res = await axios.post(`${this.baseUrl()}/deleteMessage`, { chat_id: chatId.toString(), message_id: messageId });
    return res.data?.result;
  }

  async banChatMember(chatId: string | number | bigint, userId: string | number | bigint) {
    const res = await axios.post(`${this.baseUrl()}/banChatMember`, { chat_id: chatId.toString(), user_id: userId.toString() });
    return res.data?.result;
  }

  async unbanChatMember(chatId: string | number | bigint, userId: string | number | bigint) {
    const res = await axios.post(`${this.baseUrl()}/unbanChatMember`, { chat_id: chatId.toString(), user_id: userId.toString() });
    return res.data?.result;
  }

  async restrictChatMember(chatId: string | number | bigint, userId: string | number | bigint, untilDate: number) {
    const res = await axios.post(`${this.baseUrl()}/restrictChatMember`, {
      chat_id: chatId.toString(),
      user_id: userId.toString(),
      permissions: { can_send_messages: false },
      until_date: untilDate,
    });
    return res.data?.result;
  }

  async getChat(chatId: string | number | bigint) {
    try {
      const { data } = await axios.get(`${this.baseUrl()}/getChat`, { params: { chat_id: chatId.toString() } });
      return data?.result;
    } catch (e: any) {
      this.logger.warn(`getChat failed ${chatId}: ${e.response?.data?.description || e.message}`);
      return null;
    }
  }

  async getChatMembersCount(chatId: string | number | bigint) {
    try {
      const { data } = await axios.get(`${this.baseUrl()}/getChatMemberCount`, { params: { chat_id: chatId.toString() } });
      return data?.result as number;
    } catch {
      return null;
    }
  }

  async getFile(fileId: string) {
    const { data } = await axios.get(`${this.baseUrl()}/getFile`, { params: { file_id: fileId } });
    return data?.result;
  }

  async downloadFile(filePath: string, responseType: 'arraybuffer' | 'stream' = 'arraybuffer') {
    return axios.get(`${this.fileBaseUrl()}/${filePath}`, { responseType });
  }

  async setWebhook(url: string, secretToken?: string) {
    const res = await axios.post(`${this.baseUrl()}/setWebhook`, {
      url,
      secret_token: secretToken,
      allowed_updates: ['message', 'callback_query', 'channel_post', 'chat_member'],
    });
    return res.data;
  }
}
