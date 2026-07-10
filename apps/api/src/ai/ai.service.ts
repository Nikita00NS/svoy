import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async rewriteText(text: string): Promise<string> {
    if (!text) return text;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback без ключа - просто брендируем
      return `СВОЙ · редакция\n\n${text}`;
    }

    try {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Ты редактор телеграм-канала СВОЙ. Перепиши текст в стиле канала: коротко, четко, по-русски, с сохранением смысла, добавь эмодзи где уместно. Не придумывай факты.',
            },
            { role: 'user', content: text },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        },
      );

      const rewritten = res.data?.choices?.[0]?.message?.content;
      return rewritten?.trim() || `СВОЙ · AI\n\n${text}`;
    } catch (e: any) {
      this.logger.error(`OpenAI rewrite failed: ${e?.message}`);
      // Если OpenAI упал - возвращаем оригинал с пометкой
      return `СВОЙ\n\n${text}`;
    }
  }

  // Можно расширить: генерация текста с нуля, модерация и т.д.
  async generateFromPrompt(prompt: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) return prompt;
    return this.rewriteText(prompt);
  }
}
