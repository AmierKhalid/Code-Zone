-- CreateEnum
CREATE TYPE "MessageAttachmentKind" AS ENUM ('image', 'video', 'file');

-- CreateTable
CREATE TABLE "MessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "kind" "MessageAttachmentKind" NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "byteSize" INTEGER,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageAttachment_messageId_idx" ON "MessageAttachment"("messageId");

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
