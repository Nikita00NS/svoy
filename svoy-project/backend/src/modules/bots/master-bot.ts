import { Bot, Context, InlineKeyboard } from 'grammy';
import { PrismaService } from '../../common/prisma/prisma.service';

export class MasterBot {
  constructor(
    private bot: Bot,
    private prisma: PrismaService,
  ) {
    this.setupHandlers();
  }

  private setupHandlers() {
    this.bot.command('start', async (ctx) => {
      const keyboard = new InlineKeyboard()
        .text('📢 Купить рекламу', 'ads_buy')
        .text('📤 Отправить рекламу', 'ads_submit').row()
        .text('📰 Предложить новость', 'news_submit')
        .text('⚖️ Апелляция', 'appeal').row()
        .text('💼 Устроиться', 'job')
        .text('🛟 Поддержка', 'support');

      await ctx.reply(
        'Привет! Я бот платформы «СВОЙ».\nВыберите действие:',
        { reply_markup: keyboard },
      );
    });

    this.bot.on('callback_query:data', async (ctx) => {
      const data = ctx.callbackQuery.data;
      await ctx.answerCallbackQuery();

      switch (data) {
        case 'ads_buy':
          await ctx.reply('Отправьте: ФОРМАТ | ГОРОД | СРОК_ДНЕЙ');
          (ctx as any).session = { step: 'ads_buy' };
          break;
        case 'news_submit':
          await ctx.reply('Отправьте текст новости / ссылку / фото');
          (ctx as any).session = { step: 'news_submit' };
          break;
        // ... остальные кейсы
        default:
          await ctx.reply('Функция в разработке');
      }
    });

    this.bot.on('message:text', async (ctx) => {
      const session = (ctx as any).session;
      if (session?.step === 'ads_buy') {
        // Простая обработка
        await ctx.reply('Заявка на рекламу принята. Модератор свяжется с вами.');
        (ctx as any).session = null;
      }
    });
  }
}
