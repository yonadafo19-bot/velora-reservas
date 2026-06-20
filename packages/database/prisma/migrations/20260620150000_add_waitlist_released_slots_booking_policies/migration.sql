-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('OPEN', 'MATCHED', 'CONTACTED', 'CONVERTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WaitlistSource" AS ENUM ('PUBLIC_WEB', 'ADMIN', 'WHATSAPP', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReleasedSlotStatus" AS ENUM ('OPEN', 'RESERVED', 'EXPIRED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReleasedSlotSource" AS ENUM ('CANCELLATION', 'RESCHEDULE', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReleasedSlotCandidateStatus" AS ENUM ('SUGGESTED', 'CONTACTED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DepositPolicyType" AS ENUM ('FIXED_CLP', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "defaultNoShowPolicyId" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "depositPolicyId" TEXT;

-- AlterTable
ALTER TABLE "Pack" ADD COLUMN     "depositPolicyId" TEXT;

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "customerId" TEXT,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'OPEN',
    "source" "WaitlistSource" NOT NULL,
    "desiredDateLocal" DATE,
    "desiredStartTimeLocal" VARCHAR(5),
    "desiredEndTimeLocal" VARCHAR(5),
    "preferredProfessionalId" TEXT,
    "acceptsAnyProfessional" BOOLEAN NOT NULL DEFAULT true,
    "acceptsSplitServices" BOOLEAN NOT NULL DEFAULT false,
    "maxWaitMinutes" INTEGER,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "customerNameSnapshot" VARCHAR(160) NOT NULL,
    "customerPhoneSnapshot" VARCHAR(32) NOT NULL,
    "customerEmailSnapshot" VARCHAR(320),
    "notes" TEXT,
    "expiresAt" TIMESTAMPTZ(3),
    "convertedAppointmentId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistService" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "waitlistEntryId" TEXT NOT NULL,
    "serviceId" TEXT,
    "packId" TEXT,
    "sequence" INTEGER NOT NULL,
    "serviceNameSnapshot" VARCHAR(160) NOT NULL,
    "servicePriceClpSnapshot" INTEGER NOT NULL,
    "serviceDurationMinutesSnapshot" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WaitlistService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleasedSlot" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "appointmentSegmentId" TEXT,
    "professionalId" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "ReleasedSlotStatus" NOT NULL DEFAULT 'OPEN',
    "source" "ReleasedSlotSource" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ReleasedSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleasedSlotCandidate" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "releasedSlotId" TEXT NOT NULL,
    "waitlistEntryId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reason" VARCHAR(500),
    "status" "ReleasedSlotCandidateStatus" NOT NULL DEFAULT 'SUGGESTED',
    "contactedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ReleasedSlotCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositPolicy" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "type" "DepositPolicyType" NOT NULL,
    "fixedAmountClp" INTEGER,
    "percentageBasisPoints" INTEGER,
    "status" "PolicyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DepositPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoShowPolicy" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "lateCancellationWindowMinutes" INTEGER NOT NULL,
    "trackNoShow" BOOLEAN NOT NULL DEFAULT true,
    "status" "PolicyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "NoShowPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaitlistEntry_businessId_locationId_status_desiredDateLocal_idx" ON "WaitlistEntry"("businessId", "locationId", "status", "desiredDateLocal");

-- CreateIndex
CREATE INDEX "WaitlistEntry_businessId_customerId_status_idx" ON "WaitlistEntry"("businessId", "customerId", "status");

-- CreateIndex
CREATE INDEX "WaitlistEntry_businessId_preferredProfessionalId_status_des_idx" ON "WaitlistEntry"("businessId", "preferredProfessionalId", "status", "desiredDateLocal");

-- CreateIndex
CREATE INDEX "WaitlistEntry_businessId_expiresAt_status_idx" ON "WaitlistEntry"("businessId", "expiresAt", "status");

-- CreateIndex
CREATE INDEX "WaitlistEntry_businessId_convertedAppointmentId_idx" ON "WaitlistEntry"("businessId", "convertedAppointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_businessId_id_key" ON "WaitlistEntry"("businessId", "id");

-- CreateIndex
CREATE INDEX "WaitlistService_businessId_serviceId_idx" ON "WaitlistService"("businessId", "serviceId");

-- CreateIndex
CREATE INDEX "WaitlistService_businessId_packId_idx" ON "WaitlistService"("businessId", "packId");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistService_businessId_waitlistEntryId_sequence_key" ON "WaitlistService"("businessId", "waitlistEntryId", "sequence");

-- CreateIndex
CREATE INDEX "ReleasedSlot_businessId_locationId_status_startsAt_idx" ON "ReleasedSlot"("businessId", "locationId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "ReleasedSlot_businessId_professionalId_status_startsAt_idx" ON "ReleasedSlot"("businessId", "professionalId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "ReleasedSlot_businessId_appointmentId_idx" ON "ReleasedSlot"("businessId", "appointmentId");

-- CreateIndex
CREATE INDEX "ReleasedSlot_businessId_appointmentSegmentId_idx" ON "ReleasedSlot"("businessId", "appointmentSegmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ReleasedSlot_businessId_id_key" ON "ReleasedSlot"("businessId", "id");

-- CreateIndex
CREATE INDEX "ReleasedSlotCandidate_businessId_releasedSlotId_status_scor_idx" ON "ReleasedSlotCandidate"("businessId", "releasedSlotId", "status", "score");

-- CreateIndex
CREATE INDEX "ReleasedSlotCandidate_businessId_waitlistEntryId_status_idx" ON "ReleasedSlotCandidate"("businessId", "waitlistEntryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReleasedSlotCandidate_businessId_releasedSlotId_waitlistEnt_key" ON "ReleasedSlotCandidate"("businessId", "releasedSlotId", "waitlistEntryId");

-- CreateIndex
CREATE INDEX "DepositPolicy_businessId_status_type_idx" ON "DepositPolicy"("businessId", "status", "type");

-- CreateIndex
CREATE UNIQUE INDEX "DepositPolicy_businessId_id_key" ON "DepositPolicy"("businessId", "id");

-- CreateIndex
CREATE INDEX "NoShowPolicy_businessId_status_idx" ON "NoShowPolicy"("businessId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NoShowPolicy_businessId_id_key" ON "NoShowPolicy"("businessId", "id");

-- CreateIndex
CREATE INDEX "Service_businessId_depositPolicyId_idx" ON "Service"("businessId", "depositPolicyId");

-- CreateIndex
CREATE INDEX "Pack_businessId_depositPolicyId_idx" ON "Pack"("businessId", "depositPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentSegment_businessId_id_key" ON "AppointmentSegment"("businessId", "id");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_id_defaultNoShowPolicyId_fkey" FOREIGN KEY ("id", "defaultNoShowPolicyId") REFERENCES "NoShowPolicy"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_businessId_depositPolicyId_fkey" FOREIGN KEY ("businessId", "depositPolicyId") REFERENCES "DepositPolicy"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pack" ADD CONSTRAINT "Pack_businessId_depositPolicyId_fkey" FOREIGN KEY ("businessId", "depositPolicyId") REFERENCES "DepositPolicy"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "Location"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "Customer"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_businessId_preferredProfessionalId_fkey" FOREIGN KEY ("businessId", "preferredProfessionalId") REFERENCES "Professional"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_businessId_convertedAppointmentId_fkey" FOREIGN KEY ("businessId", "convertedAppointmentId") REFERENCES "Appointment"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistService" ADD CONSTRAINT "WaitlistService_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistService" ADD CONSTRAINT "WaitlistService_businessId_waitlistEntryId_fkey" FOREIGN KEY ("businessId", "waitlistEntryId") REFERENCES "WaitlistEntry"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistService" ADD CONSTRAINT "WaitlistService_businessId_serviceId_fkey" FOREIGN KEY ("businessId", "serviceId") REFERENCES "Service"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistService" ADD CONSTRAINT "WaitlistService_businessId_packId_fkey" FOREIGN KEY ("businessId", "packId") REFERENCES "Pack"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleasedSlot" ADD CONSTRAINT "ReleasedSlot_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleasedSlot" ADD CONSTRAINT "ReleasedSlot_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "Location"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleasedSlot" ADD CONSTRAINT "ReleasedSlot_businessId_appointmentId_fkey" FOREIGN KEY ("businessId", "appointmentId") REFERENCES "Appointment"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleasedSlot" ADD CONSTRAINT "ReleasedSlot_businessId_appointmentSegmentId_fkey" FOREIGN KEY ("businessId", "appointmentSegmentId") REFERENCES "AppointmentSegment"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleasedSlot" ADD CONSTRAINT "ReleasedSlot_businessId_professionalId_fkey" FOREIGN KEY ("businessId", "professionalId") REFERENCES "Professional"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleasedSlotCandidate" ADD CONSTRAINT "ReleasedSlotCandidate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleasedSlotCandidate" ADD CONSTRAINT "ReleasedSlotCandidate_businessId_releasedSlotId_fkey" FOREIGN KEY ("businessId", "releasedSlotId") REFERENCES "ReleasedSlot"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleasedSlotCandidate" ADD CONSTRAINT "ReleasedSlotCandidate_businessId_waitlistEntryId_fkey" FOREIGN KEY ("businessId", "waitlistEntryId") REFERENCES "WaitlistEntry"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositPolicy" ADD CONSTRAINT "DepositPolicy_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoShowPolicy" ADD CONSTRAINT "NoShowPolicy_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain integrity checks not expressible in Prisma schema
ALTER TABLE "WaitlistEntry"
  ADD CONSTRAINT "WaitlistEntry_priorityScore_check" CHECK ("priorityScore" >= 0),
  ADD CONSTRAINT "WaitlistEntry_maxWaitMinutes_check" CHECK ("maxWaitMinutes" IS NULL OR "maxWaitMinutes" >= 0),
  ADD CONSTRAINT "WaitlistEntry_startTime_check" CHECK ("desiredStartTimeLocal" IS NULL OR "desiredStartTimeLocal" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD CONSTRAINT "WaitlistEntry_endTime_check" CHECK ("desiredEndTimeLocal" IS NULL OR "desiredEndTimeLocal" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD CONSTRAINT "WaitlistEntry_timeRange_check" CHECK (
    "desiredStartTimeLocal" IS NULL
    OR "desiredEndTimeLocal" IS NULL
    OR "desiredEndTimeLocal" > "desiredStartTimeLocal"
  );

ALTER TABLE "WaitlistService"
  ADD CONSTRAINT "WaitlistService_sequence_check" CHECK ("sequence" >= 0),
  ADD CONSTRAINT "WaitlistService_priceSnapshot_check" CHECK ("servicePriceClpSnapshot" >= 0),
  ADD CONSTRAINT "WaitlistService_durationSnapshot_check" CHECK ("serviceDurationMinutesSnapshot" > 0);

ALTER TABLE "ReleasedSlot"
  ADD CONSTRAINT "ReleasedSlot_dateRange_check" CHECK ("endsAt" > "startsAt");

ALTER TABLE "ReleasedSlotCandidate"
  ADD CONSTRAINT "ReleasedSlotCandidate_score_check" CHECK ("score" >= 0);

ALTER TABLE "DepositPolicy"
  ADD CONSTRAINT "DepositPolicy_valueByType_check" CHECK (
    (
      "type" = 'FIXED_CLP'
      AND "fixedAmountClp" IS NOT NULL
      AND "fixedAmountClp" >= 0
      AND "percentageBasisPoints" IS NULL
    )
    OR
    (
      "type" = 'PERCENTAGE'
      AND "fixedAmountClp" IS NULL
      AND "percentageBasisPoints" IS NOT NULL
      AND "percentageBasisPoints" BETWEEN 0 AND 10000
    )
  );

ALTER TABLE "NoShowPolicy"
  ADD CONSTRAINT "NoShowPolicy_lateCancellationWindow_check" CHECK ("lateCancellationWindowMinutes" >= 0);
