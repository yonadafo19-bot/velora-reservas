-- CreateEnum
CREATE TYPE "CatalogStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProfessionalStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "TimeOffStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "basePriceClp" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "isMainService" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAddon" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "baseServiceId" TEXT NOT NULL,
    "addonServiceId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ServiceAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "displayName" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "roleTitle" VARCHAR(160),
    "bio" TEXT,
    "phone" VARCHAR(32),
    "email" VARCHAR(320),
    "status" "ProfessionalStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalLocation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProfessionalLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalService" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "customPriceClp" INTEGER,
    "customDurationMinutes" INTEGER,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProfessionalService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pack" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "priceClp" INTEGER NOT NULL,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackItem" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PackItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessHour" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "locationId" TEXT,
    "weekday" "Weekday" NOT NULL,
    "opensAtLocal" VARCHAR(5) NOT NULL,
    "closesAtLocal" VARCHAR(5) NOT NULL,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "BusinessHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalAvailabilityRule" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "startsAtLocal" VARCHAR(5) NOT NULL,
    "endsAtLocal" VARCHAR(5) NOT NULL,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProfessionalAvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeOff" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "professionalId" TEXT,
    "locationId" TEXT,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "reason" VARCHAR(500),
    "status" "TimeOffStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TimeOff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceCategory_businessId_status_sortOrder_idx" ON "ServiceCategory"("businessId", "status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_businessId_slug_key" ON "ServiceCategory"("businessId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_businessId_id_key" ON "ServiceCategory"("businessId", "id");

-- CreateIndex
CREATE INDEX "Service_businessId_categoryId_status_sortOrder_idx" ON "Service"("businessId", "categoryId", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "Service_businessId_isMainService_status_sortOrder_idx" ON "Service"("businessId", "isMainService", "status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Service_businessId_slug_key" ON "Service"("businessId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Service_businessId_id_key" ON "Service"("businessId", "id");

-- CreateIndex
CREATE INDEX "ServiceAddon_businessId_baseServiceId_status_sortOrder_idx" ON "ServiceAddon"("businessId", "baseServiceId", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "ServiceAddon_businessId_addonServiceId_idx" ON "ServiceAddon"("businessId", "addonServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAddon_businessId_baseServiceId_addonServiceId_key" ON "ServiceAddon"("businessId", "baseServiceId", "addonServiceId");

-- CreateIndex
CREATE INDEX "Professional_businessId_status_sortOrder_idx" ON "Professional"("businessId", "status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_businessId_slug_key" ON "Professional"("businessId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_businessId_id_key" ON "Professional"("businessId", "id");

-- CreateIndex
CREATE INDEX "ProfessionalLocation_businessId_locationId_status_idx" ON "ProfessionalLocation"("businessId", "locationId", "status");

-- CreateIndex
CREATE INDEX "ProfessionalLocation_businessId_professionalId_status_idx" ON "ProfessionalLocation"("businessId", "professionalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalLocation_businessId_professionalId_locationId_key" ON "ProfessionalLocation"("businessId", "professionalId", "locationId");

-- CreateIndex
CREATE INDEX "ProfessionalService_businessId_serviceId_status_idx" ON "ProfessionalService"("businessId", "serviceId", "status");

-- CreateIndex
CREATE INDEX "ProfessionalService_businessId_professionalId_status_idx" ON "ProfessionalService"("businessId", "professionalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalService_businessId_professionalId_serviceId_key" ON "ProfessionalService"("businessId", "professionalId", "serviceId");

-- CreateIndex
CREATE INDEX "Pack_businessId_status_sortOrder_idx" ON "Pack"("businessId", "status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Pack_businessId_slug_key" ON "Pack"("businessId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Pack_businessId_id_key" ON "Pack"("businessId", "id");

-- CreateIndex
CREATE INDEX "PackItem_businessId_packId_sequence_idx" ON "PackItem"("businessId", "packId", "sequence");

-- CreateIndex
CREATE INDEX "PackItem_businessId_serviceId_idx" ON "PackItem"("businessId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "PackItem_businessId_packId_serviceId_sequence_key" ON "PackItem"("businessId", "packId", "serviceId", "sequence");

-- CreateIndex
CREATE INDEX "BusinessHour_businessId_locationId_weekday_status_idx" ON "BusinessHour"("businessId", "locationId", "weekday", "status");

-- CreateIndex
CREATE INDEX "ProfessionalAvailabilityRule_businessId_professionalId_loca_idx" ON "ProfessionalAvailabilityRule"("businessId", "professionalId", "locationId", "weekday", "status");

-- CreateIndex
CREATE INDEX "ProfessionalAvailabilityRule_businessId_locationId_weekday__idx" ON "ProfessionalAvailabilityRule"("businessId", "locationId", "weekday", "status");

-- CreateIndex
CREATE INDEX "TimeOff_businessId_startsAt_endsAt_status_idx" ON "TimeOff"("businessId", "startsAt", "endsAt", "status");

-- CreateIndex
CREATE INDEX "TimeOff_businessId_professionalId_startsAt_idx" ON "TimeOff"("businessId", "professionalId", "startsAt");

-- CreateIndex
CREATE INDEX "TimeOff_businessId_locationId_startsAt_idx" ON "TimeOff"("businessId", "locationId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Location_businessId_id_key" ON "Location"("businessId", "id");

-- AddForeignKey
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_businessId_categoryId_fkey" FOREIGN KEY ("businessId", "categoryId") REFERENCES "ServiceCategory"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAddon" ADD CONSTRAINT "ServiceAddon_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAddon" ADD CONSTRAINT "ServiceAddon_businessId_baseServiceId_fkey" FOREIGN KEY ("businessId", "baseServiceId") REFERENCES "Service"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAddon" ADD CONSTRAINT "ServiceAddon_businessId_addonServiceId_fkey" FOREIGN KEY ("businessId", "addonServiceId") REFERENCES "Service"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalLocation" ADD CONSTRAINT "ProfessionalLocation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalLocation" ADD CONSTRAINT "ProfessionalLocation_businessId_professionalId_fkey" FOREIGN KEY ("businessId", "professionalId") REFERENCES "Professional"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalLocation" ADD CONSTRAINT "ProfessionalLocation_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "Location"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalService" ADD CONSTRAINT "ProfessionalService_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalService" ADD CONSTRAINT "ProfessionalService_businessId_professionalId_fkey" FOREIGN KEY ("businessId", "professionalId") REFERENCES "Professional"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalService" ADD CONSTRAINT "ProfessionalService_businessId_serviceId_fkey" FOREIGN KEY ("businessId", "serviceId") REFERENCES "Service"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pack" ADD CONSTRAINT "Pack_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackItem" ADD CONSTRAINT "PackItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackItem" ADD CONSTRAINT "PackItem_businessId_packId_fkey" FOREIGN KEY ("businessId", "packId") REFERENCES "Pack"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackItem" ADD CONSTRAINT "PackItem_businessId_serviceId_fkey" FOREIGN KEY ("businessId", "serviceId") REFERENCES "Service"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessHour" ADD CONSTRAINT "BusinessHour_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessHour" ADD CONSTRAINT "BusinessHour_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "Location"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalAvailabilityRule" ADD CONSTRAINT "ProfessionalAvailabilityRule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalAvailabilityRule" ADD CONSTRAINT "ProfessionalAvailabilityRule_businessId_professionalId_fkey" FOREIGN KEY ("businessId", "professionalId") REFERENCES "Professional"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalAvailabilityRule" ADD CONSTRAINT "ProfessionalAvailabilityRule_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "Location"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOff" ADD CONSTRAINT "TimeOff_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOff" ADD CONSTRAINT "TimeOff_businessId_professionalId_fkey" FOREIGN KEY ("businessId", "professionalId") REFERENCES "Professional"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOff" ADD CONSTRAINT "TimeOff_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "Location"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain integrity checks not expressible in Prisma schema
ALTER TABLE "ServiceCategory"
  ADD CONSTRAINT "ServiceCategory_sortOrder_check" CHECK ("sortOrder" >= 0);

ALTER TABLE "Service"
  ADD CONSTRAINT "Service_basePriceClp_check" CHECK ("basePriceClp" >= 0),
  ADD CONSTRAINT "Service_durationMinutes_check" CHECK ("durationMinutes" > 0),
  ADD CONSTRAINT "Service_bufferBeforeMinutes_check" CHECK ("bufferBeforeMinutes" >= 0),
  ADD CONSTRAINT "Service_bufferAfterMinutes_check" CHECK ("bufferAfterMinutes" >= 0),
  ADD CONSTRAINT "Service_sortOrder_check" CHECK ("sortOrder" >= 0);

ALTER TABLE "ServiceAddon"
  ADD CONSTRAINT "ServiceAddon_distinctServices_check" CHECK ("baseServiceId" <> "addonServiceId"),
  ADD CONSTRAINT "ServiceAddon_sortOrder_check" CHECK ("sortOrder" >= 0);

ALTER TABLE "Professional"
  ADD CONSTRAINT "Professional_sortOrder_check" CHECK ("sortOrder" >= 0);

ALTER TABLE "ProfessionalService"
  ADD CONSTRAINT "ProfessionalService_customPriceClp_check" CHECK ("customPriceClp" IS NULL OR "customPriceClp" >= 0),
  ADD CONSTRAINT "ProfessionalService_customDurationMinutes_check" CHECK ("customDurationMinutes" IS NULL OR "customDurationMinutes" > 0);

ALTER TABLE "Pack"
  ADD CONSTRAINT "Pack_priceClp_check" CHECK ("priceClp" >= 0),
  ADD CONSTRAINT "Pack_sortOrder_check" CHECK ("sortOrder" >= 0);

ALTER TABLE "PackItem"
  ADD CONSTRAINT "PackItem_sequence_check" CHECK ("sequence" >= 0),
  ADD CONSTRAINT "PackItem_quantity_check" CHECK ("quantity" > 0);

ALTER TABLE "BusinessHour"
  ADD CONSTRAINT "BusinessHour_opensAtLocal_check" CHECK ("opensAtLocal" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD CONSTRAINT "BusinessHour_closesAtLocal_check" CHECK ("closesAtLocal" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

ALTER TABLE "ProfessionalAvailabilityRule"
  ADD CONSTRAINT "ProfessionalAvailabilityRule_startsAtLocal_check" CHECK ("startsAtLocal" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD CONSTRAINT "ProfessionalAvailabilityRule_endsAtLocal_check" CHECK ("endsAtLocal" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

ALTER TABLE "TimeOff"
  ADD CONSTRAINT "TimeOff_dateRange_check" CHECK ("endsAt" > "startsAt");
