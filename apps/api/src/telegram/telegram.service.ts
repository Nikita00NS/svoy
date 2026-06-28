import { Injectable, Logger } from '@nestjs/common';
import { ContentType, IntakeType } from '@prisma/client';
import { IntakesService } from '../intakes/intakes.service';
import { ContentService } from '../content/content.service';
import { ModerationService } from '../moderation/moderation.service';
import { SCENARIOS, START_TEXT } from './telegram.constants';
import { TelegramApiService } from './telegram-api.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly userState = new Map<string, IntakeType>();

  constructor(
    private readonly intakesService: IntakesService,
    private readonly telegramApi: TelegramApiService,
    private readonly moderationService: ModerationService,
    private readonly contentService: ContentService,
  ) {}

  async handleUpdate(update: any) {
    if (update.callback_query) return this.handleCallback(update.callback_query);
    if (update.message) return this.handleMessage(update.message);
    if (update.channel_post) return this.handleChannelPost(update.channel_post);
    return { ok: true };
  }

  private keyboard() {
    return {
      inline_keyboard: [
        [{ text: 'Купить рекламу', callback_data: 'scenario:AD_ORDER' }],
        [{ text: 'Предложить новость', callback_data: 'scenario:NEWS_PROPOSAL' }],
        [{ text: 'Подать апелляцию', callback_data: 'scenario:APPEAL' }],
        [{ text: 'Устроиться на работу', callback_data: 'scenario:JOB_APPLICATION' }],
        [{ text: 'Написать в поддержку', callback_data: 'scenario:SUPPORT' }],
      ],
    };
  }

  private async handleCallback(callbackQuery: any) {
    const fromId = String(callbackQuery.from?.id || '');
    const chatId = callbackQuery.message?.chat?.id;
    const scenarioKey = String(callbackQuery.data || '').split(':')[1] as keyof typeof SCENARIOS;
    const scenario = SCENARIOS[scenarioKey];
    if (!scenario || !fromId || !chatId) return { ok: true };
    this.userState.set(fromId, scenario.key as IntakeType);
    await this.telegramApi.answerCallbackQuery(callbackQuery.id, `Выбрано: ${scenario.title}`);
    await this.telegramApi.sendMessage(chatId, scenario.prompt);
    return { ok: true };
  }

  private async handleMessage(message: any) {
    const chatId = message.chat?.id;
    const from = message.from;
    if (!chatId || !from) return { ok: true };

    if (message.text === '/start') {
      await this.telegramApi.sendMessage(chatId, START_TEXT, this.keyboard());
      return { ok: true };
    }

    const scenario = this.userState.get(String(from.id));
    if (!scenario) {
      await this.telegramApi.sendMessage(chatId, 'Сначала нажмите /start и выберите нужный раздел.');
      return { ok: true };
    }

    const payload = this.extractPayload(message);
    await this.intakesService.createIntake({
      type: scenario,
      telegramChatId: BigInt(chatId),
      telegramMessageId: message.message_id ? BigInt(message.message_id) : undefined,
      text: payload.text,
      mediaFileId: payload.mediaFileId,
      mediaType: payload.mediaType,
      telegramUser: { id: BigInt(from.id), username: from.username, firstName: from.first_name, lastName: from.last_name },
      extraJson: { date: message.date, chatType: message.chat?.type },
    });
    this.userState.delete(String(from.id));
    await this.telegramApi.sendMessage(chatId, 'Спасибо. Ваша заявка сохранена и передана команде СВОЙ.');
    return { ok: true };
  }

  private async handleChannelPost(channelPost: any) {
    this.logger.log(`Channel post in ${channelPost.chat?.id}`);
    await this.contentService.registerChannelPost(channelPost);
    return { ok: true };
  }

  private extractPayload(message: any): { text?: string; mediaFileId?: string; mediaType?: ContentType } {
    if (message.video) return { text: message.caption, mediaFileId: message.video.file_id, mediaType: 'VIDEO' };
    if (message.photo?.length) return { text: message.caption, mediaFileId: message.photo[message.photo.length - 1].file_id, mediaType: 'PHOTO' };
    return { text: message.text, mediaType: 'TEXT' };
  }
}
