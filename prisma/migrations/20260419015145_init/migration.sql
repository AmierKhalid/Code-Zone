-- CreateEnum
CREATE TYPE "Categories" AS ENUM ('frontend', 'backend', 'problem solving', 'ai/ml', 'mobile dev');

-- CreateEnum
CREATE TYPE "difficulties" AS ENUM ('easy', 'medium', 'hard', 'expert');

-- CreateEnum
CREATE TYPE "tilteType" AS ENUM ('master of code', 'the debuger', 'legend', 'grandmaster', 'master', 'expert', 'journeyman', 'apprentice', 'novice');

-- CreateEnum
CREATE TYPE "accountType" AS ENUM ('standard', 'google', 'github');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FOLLOW', 'LIKE', 'COMMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountType" "accountType" NOT NULL DEFAULT 'standard',
    "name" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "bio" TEXT,
    "title" "tilteType",
    "image" TEXT,
    "totalPoints" INTEGER DEFAULT 0,
    "isVerified" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "caption" TEXT,
    "location" TEXT,
    "tags" TEXT[],
    "mediaUrl" TEXT,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "mentionedUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Save" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Save_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "postId" TEXT,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorReport" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "category" "Categories",
    "difficulty" "difficulties",
    "isSolved" BOOLEAN NOT NULL DEFAULT false,
    "acceptedSolutionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErrorReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solution" (
    "id" TEXT NOT NULL,
    "errorId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earnedPoints" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_accountId_key" ON "User"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_postId_createdAt_idx" ON "Comment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Like_userId_idx" ON "Like"("userId");

-- CreateIndex
CREATE INDEX "Like_postId_idx" ON "Like"("postId");

-- CreateIndex
CREATE INDEX "Save_userId_idx" ON "Save"("userId");

-- CreateIndex
CREATE INDEX "Save_postId_idx" ON "Save"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Save_userId_postId_key" ON "Save"("userId", "postId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_recipientId_isRead_idx" ON "Notification"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_actorId_idx" ON "Notification"("actorId");

-- CreateIndex
CREATE INDEX "Notification_postId_idx" ON "Notification"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_recipientId_actorId_postId_type_key" ON "Notification"("recipientId", "actorId", "postId", "type");

-- CreateIndex
CREATE INDEX "ErrorReport_authorId_idx" ON "ErrorReport"("authorId");

-- CreateIndex
CREATE INDEX "ErrorReport_difficulty_idx" ON "ErrorReport"("difficulty");

-- CreateIndex
CREATE INDEX "ErrorReport_isSolved_idx" ON "ErrorReport"("isSolved");

-- CreateIndex
CREATE INDEX "ErrorReport_createdAt_idx" ON "ErrorReport"("createdAt");

-- CreateIndex
CREATE INDEX "Solution_errorId_idx" ON "Solution"("errorId");

-- CreateIndex
CREATE INDEX "Solution_authorId_idx" ON "Solution"("authorId");

-- CreateIndex
CREATE INDEX "Solution_isApproved_idx" ON "Solution"("isApproved");

-- CreateIndex
CREATE INDEX "Solution_createdAt_idx" ON "Solution"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Solution_errorId_authorId_key" ON "Solution"("errorId", "authorId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorReport" ADD CONSTRAINT "ErrorReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_errorId_fkey" FOREIGN KEY ("errorId") REFERENCES "ErrorReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
