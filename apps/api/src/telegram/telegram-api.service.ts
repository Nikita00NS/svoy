import axios from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TelegramApiService {
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
    return axios.post(`${this.baseUrl()}/sendMessage`, { chat_id: chatId.toString(), text, reply_markup: replyMarkup });
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string) {
    return axios.post(`${this.baseUrl()}/answerCallbackQuery`, { callback_query_id: callbackQueryId, text });
  }

  async deleteMessage(chatId: string | number | bigint, messageId: number) {
    return axios.post(`${this.baseUrl()}/deleteMessage`, { chat_id: chatId.toString(), message_id: messageId });
  }

  async banChatMember(chatId: string | number | bigint, userId: string | number | bigint) {
    return axios.post(`${this.baseUrl()}/banChatMember`, { chat_id: chatId.toString(), user_id: userId.toString() });
  }

  async restrictChatMember(chatId: string | number | bigint, userId: string | number | bigint, untilDate: number) {
    return axios.post(`${this.baseUrl()}/restrictChatMember`, {
      chat_id: chatId.toString(),
      user_id: userId.toString(),
      permissions: { can_send_messages: false },
      until_date: untilDate,
    });
  }

  async sendPhoto(chatId: string | number | bigint, photo: string, caption?: string) {
    return axios.post(`${this.baseUrl()}/sendPhoto`, { chat_id: chatId.toString(), photo, caption });
  }

  async sendVideo(chatId: string | number | bigint, video: string, caption?: string) {
    return axios.post(`${this.baseUrl()}/sendVideo`, { chat_id: chatId.toString(), video, caption });
  }

  async sendDocument(chatId: string | number | bigint, document: string, caption?: string) {
    return axios.post(`${this.baseUrl()}/sendDocument`, { chat_id: chatId.toString(), document, caption });
  }

  async getFile(fileId: string) {
    const { data } = await axios.get(`${this.baseUrl()}/getFile`, { params: { file_id: fileId } });
    return data?.result;
  }

  async downloadFile(filePath: string, responseType: 'arraybuffer' | 'stream' = 'arraybuffer') {
    return axios.get(`${this.fileBaseUrl()}/${filePath}`, { responseType });
  }

  async setWebhook(url: string, secretToken?: string) {
    return axios.post(`${this.baseUrl()}/setWebhook`, {
      url,
      secret_token: secretToken,
      allowed_updates: ['message', 'callback_query', 'channel_post'],
    });
  }
}
