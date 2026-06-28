import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async rewriteText(text: string) {
    if (!text) return text;
    if (!process.env.OPENAI_API_KEY) {
      return `СВОЙ · редакция\n\n${text}`;
    }
    return `СВОЙ · AI rewrite\n\n${text}`;
  }
}
