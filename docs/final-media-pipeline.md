# Final media pipeline — СВОЙ

## Что теперь реализовано

### 1. Download media from Telegram
Для content items с `mediaFileId` доступен endpoint:
- `POST /content/:id/download-media`

Что происходит:
- backend вызывает `getFile`
- получает `file_path`
- скачивает бинарный файл из Telegram
- сохраняет в `STORAGE_DIR/downloads`
- пишет путь в `content_items.localMediaPath`

### 2. Real image watermark
Для изображений доступен endpoint:
- `POST /content/:id/process-watermark`

Что происходит:
- файл читается локально
- через `sharp` накладывается watermark
- результат сохраняется в `STORAGE_DIR/processed`
- путь сохраняется в `processedMediaPath`

### 3. Video watermark hook
Для видео:
- используется ffmpeg command hook
- если ffmpeg доступен, создается обработанный mp4
- если нет — возвращается fallback на исходный файл

### 4. Scheduled publish to Telegram channel
Worker:
- каждые 30 секунд ищет `content_items` со статусом `SCHEDULED`
- если `scheduledFor <= now()` и есть `channel.telegramId`
- публикует:
  - text -> sendMessage
  - photo -> sendPhoto
  - video -> sendVideo
- после публикации пишет:
  - `status = PUBLISHED`
  - `publishedMessageId`

## Важные условия
- бот должен быть админом канала
- в `channels.telegramId` должен быть правильный ID канала
- для production желательно общий persistent volume для storage
- для video watermarking нужен `ffmpeg`

## Рекомендуемый workflow
1. Пользователь отправляет новость боту
2. Создаётся `intake`
3. Автоматически создаётся `content_item`
4. В админке:
   - Download media
   - Watermark
   - AI Rewrite
   - Approve
   - Schedule
5. Worker публикует пост в канал
