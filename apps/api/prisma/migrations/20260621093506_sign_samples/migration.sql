-- CreateTable
CREATE TABLE "sign_samples" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "handCount" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sign_samples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sign_samples_label_idx" ON "sign_samples"("label");

-- CreateIndex
CREATE INDEX "sign_samples_userId_idx" ON "sign_samples"("userId");

-- AddForeignKey
ALTER TABLE "sign_samples" ADD CONSTRAINT "sign_samples_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
