-- AlterEnum ContentType add POLL
ALTER TYPE "ContentType" ADD VALUE IF NOT EXISTS 'POLL';

-- AlterTable Channel - new fields
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "autoModeration" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "autoPublishRss" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "defaultPollAnonymous" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "settingsJson" JSONB;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "statsJson" JSONB;

-- AlterTable ContentItem - new fields
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "moderationComment" TEXT;
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "pollQuestion" TEXT;
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "pollOptions" JSONB;
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "isAnonymousPoll" BOOLEAN DEFAULT true;
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "viewsCount" INTEGER DEFAULT 0;
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "extraJson" JSONB;

-- AlterTable IntakeRequest
ALTER TABLE "IntakeRequest" ADD COLUMN IF NOT EXISTS "moderatorComment" TEXT;
ALTER TABLE "IntakeRequest" ADD COLUMN IF NOT EXISTS "contentItemId" TEXT;

-- AlterTable RssSource
ALTER TABLE "RssSource" ADD COLUMN IF NOT EXISTS "channelId" TEXT;
ALTER TABLE "RssSource" ADD COLUMN IF NOT EXISTS "autoPublish" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey RssSource -> Channel
DO $$ BEGIN
  ALTER TABLE "RssSource" ADD CONSTRAINT "RssSource_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Index for channelId
CREATE INDEX IF NOT EXISTS "ContentItem_channelId_idx" ON "ContentItem"("channelId");
