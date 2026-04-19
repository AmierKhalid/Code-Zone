-- AlterTable
ALTER TABLE "Post" ADD COLUMN "sharesCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PostShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostShare_postId_idx" ON "PostShare"("postId");

-- CreateIndex
CREATE INDEX "PostShare_userId_idx" ON "PostShare"("userId");

-- AddForeignKey
ALTER TABLE "PostShare" ADD CONSTRAINT "PostShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostShare" ADD CONSTRAINT "PostShare_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
