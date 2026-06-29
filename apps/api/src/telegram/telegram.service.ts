import { Injectable, Logger } from '@nestjs/common';
import { ContentType, IntakeType } from '@prisma/client';
import { IntakesService } from '../intakes/intakes.service';
import { ContentService } from '../content/content.service';
import { ModerationService } from '../moderation/moderation.service';
import { TelegramApiService } from './telegram-api.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly userState = new Map<string, IntakeType>();

  private readonly buttonToScenario: Record<string, IntakeType> = {
    'Купить рекламу': 'AD_ORDER',
    'Предложить новость': 'NEWS_PROPOSAL',
    'Подать апелляцию': 'APPEAL',
    'Устроиться на работу': 'JOB_APPLICATION',
    'Написать в поддержку': 'SUPPORT',
  };

  private readonly prompts: Record<IntakeType, string> = {
    AD_ORDER:
      'Опишите задачу по рекламе. Можно отправить текст, фото или видео одним сообщением.',
    NEWS_PROPOSAL:
      'Отправьте новость: текст, фото или видео. Можно добавить краткое описание.',
    APPEAL:
      'Опишите ситуацию для апелляции. При необходимости приложите фото или видео.',
    JOB_APPLICATION:
      'Расскажите о себе, опыте и желаемой роли. Можно приложить портфолио, фото или видео.',
    SUPPORT:
      'Опишите ваш вопрос или проблему. Можно приложить скриншот или видео.',
  };

  constructor(
    private readonly intakesService: IntakesService,
    private readonly telegramApi: TelegramApiService,
    private readonly moderationService: ModerationService,
    private readonly contentService: ContentService,
  ) {}

  async handleUpdate(update: any) {
    if (update.callback_query) {
      return this.handleCallback(update.callback_query);
    }

    if (update.message) {
      return this.handleMessage(update.message);
    }

    if (update.channel_post) {
      return this.handleChannelPost(update.channel_post);
    }

    return { ok: true };
  }

  private getReplyKeyboard() {
    return {
      keyboard: [
        [{ text: 'Купить рекламу' }, { text: 'Предложить новость' }],
        [{ text: 'Подать апелляцию' }, { text: 'Устроиться на работу' }],
        [{ text: 'Написать в поддержку' }],
      ],
      resize_keyboard: true,
      persistent_keyboard: true,
      one_time_keyboard: false,
    };
  }

  private async handleCallback(_callbackQuery: any) {
    return { ok: true };
  }

  private async handleMessage(message: any) {
    const chatId = message.chat?.id;
    const from = message.from;

    if (!chatId || !from) {
      return { ok: true };
    }

    const text = message.text?.trim();

    if (text === '/start' || text === '/menu' || text === 'Меню') {
      await this.telegramApi.sendMessage(
        chatId,
        'Добро пожаловать в СВОЙ.\n\nВыберите нужный раздел в меню ниже.',
        this.getReplyKeyboard(),
      );
      return { ok: true };
    }

    if (text && this.buttonToScenario[text]) {
      const scenario = this.buttonToScenario[text];
      this.userState.set(String(from.id), scenario);

      await this.telegramApi.sendMessage(
        chatId,
        this.prompts[scenario],
        this.getReplyKeyboard(),
      );

      return { ok: true };
    }

    const activeScenario = this.userState.get(String(from.id));

    if (!activeScenario) {
      await this.telegramApi.sendMessage(
        chatId,
        'Нажмите /start или выберите нужный раздел в меню ниже.',
        this.getReplyKeyboard(),
      );
      return { ok: true };
    }

    const payload = this.extractPayload(message);

    await this.intakesService.createIntake({
      type: activeScenario,
      telegramChatId: BigInt(chatId),
      telegramMessageId: message.message_id
        ? BigInt(message.message_id)
        : undefined,
      text: payload.text,
      mediaFileId: payload.mediaFileId,
      mediaType: payload.mediaType,
      telegramUser: {
        id: BigInt(from.id),
        username: from.username,
        firstName: from.first_name,
        lastName: from.last_name,
      },
      extraJson: {
        date: message.date,
        chatType: message.chat?.type,
      },
    });

    this.userState.delete(String(from.id));

    await this.telegramApi.sendMessage(
      chatId,
      'Спасибо. Ваша заявка сохранена и передана команде СВОЙ.',
      this.getReplyKeyboard(),
    );

    return { ok: true };
  }

  private async handleChannelPost(channelPost: any) {
    this.logger.log(`Channel post in ${channelPost.chat?.id}`);
    await this.contentService.registerChannelPost(channelPost);
    return { ok: true };
  }

  private extractPayload(
    message: any,
  ): { text?: string; mediaFileId?: string; mediaType?: ContentType } {
    if (message.video) {
      return {
        text: message.caption,
        mediaFileId: message.video.file_id,
        mediaType: 'VIDEO',
      };
    }

    if (message.photo?.length) {
      return {
        text: message.caption,
        mediaFileId: message.photo[message.photo.length - 1].file_id,
        mediaType: 'PHOTO',
      };
    }

    return {
      text: message.text,
      mediaType: 'TEXT',
    };
  }
}
