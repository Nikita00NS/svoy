import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

type Provider = 'openai' | 'groq' | 'gemini' | 'openrouter' | 'none';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private detectProvider(): Provider {
    const forced = (process.env.AI_PROVIDER || 'auto').toLowerCase();
    if (forced !== 'auto') return forced as Provider;

    if (process.env.GROQ_API_KEY) return 'groq';
    if (process.env.GEMINI_API_KEY) return 'gemini';
    if (process.env.OPENROUTER_API_KEY) return 'openrouter';
    if (process.env.OPENAI_API_KEY) return 'openai';
    return 'none';
  }

  async rewriteText(text: string): Promise<string> {
    if (!text) return text;
    const provider = this.detectProvider();

    if (provider === 'none') {
      return `СВОЙ · редакция\n\n${text}`;
    }

    try {
      if (provider === 'groq') return await this.rewriteGroq(text);
      if (provider === 'gemini') return await this.rewriteGemini(text);
      if (provider === 'openrouter') return await this.rewriteOpenRouter(text);
      if (provider === 'openai') return await this.rewriteOpenAI(text);
    } catch (e: any) {
      this.logger.error(`${provider} rewrite failed: ${e.message}`);
    }

    return `СВОЙ\n\n${text}`;
  }

  private async rewriteOpenAI(text: string): Promise<string> {
    const key = process.env.OPENAI_API_KEY!;
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Ты редактор телеграм-канала СВОЙ. Перепиши текст коротко, четко, по-русски, сохрани смысл, добавь эмодзи где уместно. Не придумывай факты.' },
          { role: 'user', content: text },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, timeout: 20000 },
    );
    return res.data?.choices?.[0]?.message?.content?.trim() || text;
  }

  private async rewriteGroq(text: string): Promise<string> {
    const key = process.env.GROQ_API_KEY!;
    // Groq OpenAI-compatible, быстрая и бесплатная
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Ты редактор ТГ-канала СВОЙ. Перепиши текст коротко, по-русски, с эмодзи.' },
          { role: 'user', content: text },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, timeout: 15000 },
    );
    return res.data?.choices?.[0]?.message?.content?.trim() || text;
  }

  private async rewriteGemini(text: string): Promise<string> {
    const key = process.env.GEMINI_API_KEY!;
    // Gemini API - бесплатная квота 1500 req/day, без карты
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        contents: [{ parts: [{ text: `Ты редактор канала СВОЙ. Перепиши текст коротко, по-русски, с эмодзи, сохрани смысл:\n\n${text}` }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 20000 },
    );
    const candidate = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate?.trim() || text;
  }

  private async rewriteOpenRouter(text: string): Promise<string> {
    const key = process.env.OPENROUTER_API_KEY!;
    // OpenRouter - бесплатные модели с :free
    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1:free',
        messages: [
          { role: 'system', content: 'Ты редактор ТГ-канала СВОЙ. Перепиши текст коротко, по-русски.' },
          { role: 'user', content: text },
        ],
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'https://svoy.local',
          'X-Title': 'SVOY',
        },
        timeout: 25000,
      },
    );
    return res.data?.choices?.[0]?.message?.content?.trim() || text;
  }

  async generateFromPrompt(prompt: string): Promise<string> {
    return this.rewriteText(prompt);
  }
}
