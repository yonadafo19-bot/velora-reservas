-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AppointmentSource" AS ENUM ('PUBLIC_WEB', 'ADMIN', 'WHATSAPP', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AppointmentSegmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CancellationSource" AS ENUM ('CUSTOMER', 'ADMIN', 'SYSTEM');

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "source" "AppointmentSource" NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "totalPriceClp" INTEGER NOT NULL,
    "totalDurationMinutes" INTEGER NOT NULL,
    "currencySnapshot" VARCHAR(3) NOT NULL DEFAULT 'CLP',
    "timezoneSnapshot" VARCHAR(64) NOT NULL DEFAULT 'America/Santiago',
    "bookingRequestId" VARCHAR(128),
    "publicTokenHash" VARCHAR(128),
    "customerNotes" TEXT,
    "internalNotes" TEXT,
    "isFirstVisit" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMPTZ(3),
    "cancellationReason" VARCHAR(500),
    "cancellationSource" "CancellationSource",
    "isLateCancellation" BOOLEAN NOT NULL DEFAULT false,
    "markedNoShowAt" TIMESTAMPTZ(3),
    "depositRequiredSnapshot" BOOLEAN NOT NULL DEFAULT false,
    "depositPolicySnapshotJson" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentService" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "serviceId" TEXT,
    "packId" TEXT,
    "sequence" INTEGER NOT NULL,
    "serviceNameSnapshot" VARCHAR(160) NOT NULL,
    "servicePriceClpSnapshot" INTEGER NOT NULL,
    "serviceDurationMinutesSnapshot" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AppointmentService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentSegment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "appointmentServiceId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "blocksAvailability" BOOLEAN NOT NULL DEFAULT true,
    "status" "AppointmentSegmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AppointmentSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_publicTokenHash_key" ON "Appointment"("publicTokenHash");

-- CreateIndex
CREATE INDEX "Appointment_businessId_locationId_status_startAt_idx" ON "Appointment"("businessId", "locationId", "status", "startAt");

-- CreateIndex
CREATE INDEX "Appointment_businessId_customerId_startAt_idx" ON "Appointment"("businessId", "customerId", "startAt");

-- CreateIndex
CREATE INDEX "Appointment_businessId_status_startAt_endAt_idx" ON "Appointment"("businessId", "status", "startAt", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_businessId_bookingRequestId_key" ON "Appointment"("businessId", "bookingRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_businessId_id_key" ON "Appointment"("businessId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_businessId_id_locationId_key" ON "Appointment"("businessId", "id", "locationId");

-- CreateIndex
CREATE INDEX "AppointmentService_businessId_serviceId_idx" ON "AppointmentService"("businessId", "serviceId");

-- CreateIndex
CREATE INDEX "AppointmentService_businessId_packId_idx" ON "AppointmentService"("businessId", "packId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentService_businessId_appointmentId_sequence_key" ON "AppointmentService"("businessId", "appointmentId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentService_businessId_appointmentId_id_key" ON "AppointmentService"("businessId", "appointmentId", "id");

-- CreateIndex
CREATE INDEX "AppointmentSegment_businessId_professionalId_startsAt_endsA_idx" ON "AppointmentSegment"("businessId", "professionalId", "startsAt", "endsAt", "status");

-- CreateIndex
CREATE INDEX "AppointmentSegment_businessId_locationId_startsAt_status_idx" ON "AppointmentSegment"("businessId", "locationId", "startsAt", "status");

-- CreateIndex
CREATE INDEX "AppointmentSegment_businessId_appointmentServiceId_sequence_idx" ON "AppointmentSegment"("businessId", "appointmentServiceId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentSegment_businessId_appointmentId_sequence_key" ON "AppointmentSegment"("businessId", "appointmentId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_businessId_id_key" ON "Customer"("businessId", "id");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "Location"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "Customer"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_businessId_appointmentId_fkey" FOREIGN KEY ("businessId", "appointmentId") REFERENCES "Appointment"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_businessId_serviceId_fkey" FOREIGN KEY ("businessId", "serviceId") REFERENCES "Service"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_businessId_packId_fkey" FOREIGN KEY ("businessId", "packId") REFERENCES "Pack"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSegment" ADD CONSTRAINT "AppointmentSegment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSegment" ADD CONSTRAINT "AppointmentSegment_businessId_appointmentId_locationId_fkey" FOREIGN KEY ("businessId", "appointmentId", "locationId") REFERENCES "Appointment"("businessId", "id", "locationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSegment" ADD CONSTRAINT "AppointmentSegment_businessId_appointmentId_appointmentSer_fkey" FOREIGN KEY ("businessId", "appointmentId", "appointmentServiceId") REFERENCES "AppointmentService"("businessId", "appointmentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSegment" ADD CONSTRAINT "AppointmentSegment_businessId_professionalId_fkey" FOREIGN KEY ("businessId", "professionalId") REFERENCES "Professional"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSegment" ADD CONSTRAINT "AppointmentSegment_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "Location"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Required by the exclusion constraint for equality operators on text columns
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Domain integrity checks not expressible in Prisma schema
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_dateRange_check" CHECK ("endAt" > "startAt"),
  ADD CONSTRAINT "Appointment_totalPriceClp_check" CHECK ("totalPriceClp" >= 0),
  ADD CONSTRAINT "Appointment_totalDurationMinutes_check" CHECK ("totalDurationMinutes" > 0);

ALTER TABLE "AppointmentService"
  ADD CONSTRAINT "AppointmentService_sequence_check" CHECK ("sequence" >= 0),
  ADD CONSTRAINT "AppointmentService_priceSnapshot_check" CHECK ("servicePriceClpSnapshot" >= 0),
  ADD CONSTRAINT "AppointmentService_durationSnapshot_check" CHECK ("serviceDurationMinutesSnapshot" > 0);

ALTER TABLE "AppointmentSegment"
  ADD CONSTRAINT "AppointmentSegment_sequence_check" CHECK ("sequence" >= 0),
  ADD CONSTRAINT "AppointmentSegment_dateRange_check" CHECK ("endsAt" > "startsAt");

-- Half-open ranges allow adjacent segments but reject active professional overlaps.
ALTER TABLE "AppointmentSegment"
  ADD CONSTRAINT "AppointmentSegment_no_professional_overlap"
  EXCLUDE USING gist (
    "businessId" WITH =,
    "professionalId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
  )
  WHERE ("blocksAvailability" = true AND "status" <> 'CANCELLED');
