-- CreateEnum
CREATE TYPE "ReplayStatus" AS ENUM ('pending', 'succeeded', 'http_error', 'timeout', 'network_error');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "captureToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" SERIAL NOT NULL,
    "endpointId" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "rawQuery" TEXT NOT NULL DEFAULT '',
    "headers" JSONB NOT NULL,
    "rawBody" BYTEA NOT NULL,
    "bodySizeBytes" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplayAttempt" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "status" "ReplayStatus" NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTruncated" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "httpStatusCode" INTEGER,
    "responseBody" BYTEA,
    "durationMs" INTEGER,
    "errorMessage" TEXT,

    CONSTRAINT "ReplayAttempt_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Session" ADD CONSTRAINT "Session_expiresAt_check" CHECK ("expiresAt" > "createdAt");

ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_name_check" CHECK (length(trim("name")) > 0);

ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_bodySize_check" CHECK ("bodySizeBytes" = octet_length("rawBody"));

ALTER TABLE "ReplayAttempt" ADD CONSTRAINT "ReplayAttempt_durationMs_check" CHECK ("durationMs" >= 0);

ALTER TABLE "ReplayAttempt" ADD CONSTRAINT "ReplayAttempt_httpStatusCode_check" CHECK ("httpStatusCode" BETWEEN 100 AND 599);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEndpoint_captureToken_key" ON "WebhookEndpoint"("captureToken");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplayAttempt" ADD CONSTRAINT "ReplayAttempt_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WebhookEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
