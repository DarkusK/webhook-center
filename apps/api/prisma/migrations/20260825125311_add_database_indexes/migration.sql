-- CreateIndex
CREATE INDEX "WebhookEndpoint_userId_idx" ON "WebhookEndpoint"("userId");

-- CreateIndex
CREATE INDEX "WebhookEvent_endpointId_receivedAt_idx" ON "WebhookEvent"("endpointId", "receivedAt" DESC);
