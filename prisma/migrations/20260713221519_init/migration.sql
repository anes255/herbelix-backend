-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "description" TEXT,
    "batchNumber" TEXT,
    "productionDate" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "verifiedCount" INTEGER NOT NULL DEFAULT 0,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationLog" (
    "id" SERIAL NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "ipAddress" TEXT,
    "country" TEXT,
    "browser" TEXT,
    "device" TEXT,
    "result" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "supportPhone" TEXT NOT NULL DEFAULT '+213779452212',
    "siteName" TEXT NOT NULL DEFAULT 'التحقق من أصالة المنتج',
    "logo" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationCode_code_key" ON "VerificationCode"("code");

-- CreateIndex
CREATE INDEX "VerificationCode_productName_idx" ON "VerificationCode"("productName");

-- CreateIndex
CREATE INDEX "VerificationCode_enabled_idx" ON "VerificationCode"("enabled");

-- CreateIndex
CREATE INDEX "VerificationCode_verifiedCount_idx" ON "VerificationCode"("verifiedCount");

-- CreateIndex
CREATE INDEX "VerificationCode_createdAt_idx" ON "VerificationCode"("createdAt");

-- CreateIndex
CREATE INDEX "VerificationLog_timestamp_idx" ON "VerificationLog"("timestamp");

-- CreateIndex
CREATE INDEX "VerificationLog_result_idx" ON "VerificationLog"("result");

-- CreateIndex
CREATE INDEX "VerificationLog_verificationCode_idx" ON "VerificationLog"("verificationCode");
