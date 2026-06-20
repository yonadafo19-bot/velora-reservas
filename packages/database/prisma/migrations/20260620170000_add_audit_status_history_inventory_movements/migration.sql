-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('CUSTOMER', 'OWNER', 'ADMIN', 'RECEPTIONIST', 'PROFESSIONAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('BUSINESS', 'LOCATION', 'USER', 'MEMBERSHIP', 'CUSTOMER', 'SERVICE_CATEGORY', 'SERVICE', 'SERVICE_ADDON', 'PROFESSIONAL', 'PROFESSIONAL_LOCATION', 'PROFESSIONAL_SERVICE', 'PACK', 'PACK_ITEM', 'BUSINESS_HOUR', 'PROFESSIONAL_AVAILABILITY_RULE', 'TIME_OFF', 'APPOINTMENT', 'APPOINTMENT_SERVICE', 'APPOINTMENT_SEGMENT', 'WAITLIST_ENTRY', 'WAITLIST_SERVICE', 'RELEASED_SLOT', 'RELEASED_SLOT_CANDIDATE', 'DEPOSIT_POLICY', 'NO_SHOW_POLICY', 'PRODUCT_CATEGORY', 'PRODUCT', 'PRODUCT_INVENTORY', 'PRODUCT_RECOMMENDATION', 'PRODUCT_INQUIRY', 'RETAIL_ORDER', 'RETAIL_ORDER_ITEM', 'RESOURCE_TYPE', 'RESOURCE', 'SERVICE_RESOURCE_REQUIREMENT', 'INVENTORY_MOVEMENT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'ARCHIVED', 'DEACTIVATED', 'CANCELLED', 'RESCHEDULED', 'CONFIRMED', 'COMPLETED', 'MARKED_NO_SHOW', 'SERVICE_ADDED', 'SERVICE_REMOVED', 'PROFESSIONAL_CHANGED', 'WAITLIST_JOINED', 'WAITLIST_MATCHED', 'WAITLIST_CONTACTED', 'WAITLIST_CONVERTED', 'SLOT_RELEASED', 'SLOT_RESERVED', 'WHATSAPP_CLICKED', 'CALENDAR_EXPORTED', 'VIP_LEVEL_CHANGED', 'STOCK_ADJUSTED', 'INVENTORY_MOVED', 'PRODUCT_INQUIRY_CREATED', 'RETAIL_ORDER_CREATED', 'POLICY_CHANGED', 'RESOURCE_CHANGED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'STOCK_ADJUSTMENT', 'RESERVED', 'RELEASED', 'SOLD', 'CANCELLED', 'CORRECTION');

-- CreateEnum
CREATE TYPE "InventoryReferenceType" AS ENUM ('APPOINTMENT', 'RETAIL_ORDER', 'RETAIL_ORDER_ITEM', 'PRODUCT_INQUIRY', 'ADMIN', 'SYSTEM');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "locationId" TEXT,
    "actorType" "ActorType" NOT NULL,
    "actorId" VARCHAR(128),
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" VARCHAR(128) NOT NULL,
    "action" "AuditAction" NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "metadataJson" JSONB,
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "requestId" VARCHAR(128),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentStatusHistory" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "previousStatus" "AppointmentStatus",
    "nextStatus" "AppointmentStatus" NOT NULL,
    "reason" VARCHAR(500),
    "actorType" "ActorType" NOT NULL,
    "actorId" VARCHAR(128),
    "requestId" VARCHAR(128),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "productInventoryId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "movementType" "InventoryMovementType" NOT NULL,
    "delta" INTEGER NOT NULL,
    "previousOnHand" INTEGER NOT NULL,
    "nextOnHand" INTEGER NOT NULL,
    "previousReserved" INTEGER NOT NULL,
    "nextReserved" INTEGER NOT NULL,
    "reason" VARCHAR(500),
    "referenceType" "InventoryReferenceType",
    "referenceId" VARCHAR(128),
    "actorType" "ActorType" NOT NULL,
    "actorId" VARCHAR(128),
    "idempotencyKey" VARCHAR(128),
    "requestId" VARCHAR(128),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_businessId_createdAt_idx" ON "AuditLog"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_businessId_entityType_entityId_idx" ON "AuditLog"("businessId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_businessId_actorType_actorId_idx" ON "AuditLog"("businessId", "actorType", "actorId");

-- CreateIndex
CREATE INDEX "AuditLog_businessId_requestId_idx" ON "AuditLog"("businessId", "requestId");

-- CreateIndex
CREATE INDEX "AuditLog_businessId_locationId_createdAt_idx" ON "AuditLog"("businessId", "locationId", "createdAt");

-- CreateIndex
CREATE INDEX "AppointmentStatusHistory_businessId_appointmentId_createdAt_idx" ON "AppointmentStatusHistory"("businessId", "appointmentId", "createdAt");

-- CreateIndex
CREATE INDEX "AppointmentStatusHistory_businessId_requestId_idx" ON "AppointmentStatusHistory"("businessId", "requestId");

-- CreateIndex
CREATE INDEX "InventoryMovement_businessId_productInventoryId_createdAt_idx" ON "InventoryMovement"("businessId", "productInventoryId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_businessId_productId_locationId_createdAt_idx" ON "InventoryMovement"("businessId", "productId", "locationId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_businessId_referenceType_referenceId_idx" ON "InventoryMovement"("businessId", "referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "InventoryMovement_businessId_requestId_idx" ON "InventoryMovement"("businessId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_businessId_idempotencyKey_key" ON "InventoryMovement"("businessId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProductInventory_businessId_id_productId_locationId_key" ON "ProductInventory"("businessId", "id", "productId", "locationId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "Location"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusHistory" ADD CONSTRAINT "AppointmentStatusHistory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusHistory" ADD CONSTRAINT "AppointmentStatusHistory_businessId_appointmentId_fkey" FOREIGN KEY ("businessId", "appointmentId") REFERENCES "Appointment"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_businessId_productInventoryId_productId__fkey" FOREIGN KEY ("businessId", "productInventoryId", "productId", "locationId") REFERENCES "ProductInventory"("businessId", "id", "productId", "locationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_businessId_productId_fkey" FOREIGN KEY ("businessId", "productId") REFERENCES "Product"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "Location"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain integrity checks not expressible in Prisma schema
ALTER TABLE "AppointmentStatusHistory"
  ADD CONSTRAINT "AppointmentStatusHistory_transition_check" CHECK (
    "previousStatus" IS NULL OR "previousStatus" <> "nextStatus"
  );

ALTER TABLE "InventoryMovement"
  ADD CONSTRAINT "InventoryMovement_previousOnHand_check" CHECK ("previousOnHand" >= 0),
  ADD CONSTRAINT "InventoryMovement_nextOnHand_check" CHECK ("nextOnHand" >= 0),
  ADD CONSTRAINT "InventoryMovement_previousReserved_check" CHECK (
    "previousReserved" >= 0 AND "previousReserved" <= "previousOnHand"
  ),
  ADD CONSTRAINT "InventoryMovement_nextReserved_check" CHECK (
    "nextReserved" >= 0 AND "nextReserved" <= "nextOnHand"
  );
