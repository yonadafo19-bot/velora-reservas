-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductRecommendationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductInquiryChannel" AS ENUM ('PUBLIC_WEB', 'ADMIN', 'WHATSAPP', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ProductInquiryStatus" AS ENUM ('OPEN', 'CONTACTED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RetailOrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RetailOrderSource" AS ENUM ('ADMIN', 'APPOINTMENT', 'WHATSAPP', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResourceTypeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "categoryId" TEXT,
    "sku" VARCHAR(100),
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "priceClp" INTEGER NOT NULL,
    "imageUrl" VARCHAR(2048),
    "tracksInventory" BOOLEAN NOT NULL DEFAULT true,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInventory" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "onHand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProductInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRecommendation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "message" VARCHAR(500),
    "status" "ProductRecommendationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProductRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInquiry" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "locationId" TEXT,
    "productId" TEXT NOT NULL,
    "serviceId" TEXT,
    "appointmentId" TEXT,
    "customerId" TEXT,
    "channel" "ProductInquiryChannel" NOT NULL,
    "customerNameSnapshot" VARCHAR(160),
    "customerPhoneSnapshot" VARCHAR(32),
    "message" TEXT,
    "status" "ProductInquiryStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProductInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailOrder" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "customerId" TEXT,
    "appointmentId" TEXT,
    "status" "RetailOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "RetailOrderSource" NOT NULL,
    "totalClp" INTEGER NOT NULL DEFAULT 0,
    "currencySnapshot" VARCHAR(3) NOT NULL DEFAULT 'CLP',
    "customerNameSnapshot" VARCHAR(160),
    "customerPhoneSnapshot" VARCHAR(32),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RetailOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailOrderItem" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "retailOrderId" TEXT NOT NULL,
    "productId" TEXT,
    "sequence" INTEGER NOT NULL,
    "productNameSnapshot" VARCHAR(160) NOT NULL,
    "productSkuSnapshot" VARCHAR(100),
    "unitPriceClpSnapshot" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalClpSnapshot" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RetailOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceType" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "status" "ResourceTypeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ResourceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "resourceTypeId" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceResourceRequirement" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "resourceTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ServiceResourceRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductCategory_businessId_status_sortOrder_idx" ON "ProductCategory"("businessId", "status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_businessId_slug_key" ON "ProductCategory"("businessId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_businessId_id_key" ON "ProductCategory"("businessId", "id");

-- CreateIndex
CREATE INDEX "Product_businessId_categoryId_status_sortOrder_idx" ON "Product"("businessId", "categoryId", "status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Product_businessId_slug_key" ON "Product"("businessId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_businessId_sku_key" ON "Product"("businessId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_businessId_id_key" ON "Product"("businessId", "id");

-- CreateIndex
CREATE INDEX "ProductInventory_businessId_locationId_productId_idx" ON "ProductInventory"("businessId", "locationId", "productId");

-- CreateIndex
CREATE INDEX "ProductInventory_businessId_locationId_reorderPoint_idx" ON "ProductInventory"("businessId", "locationId", "reorderPoint");

-- CreateIndex
CREATE UNIQUE INDEX "ProductInventory_businessId_productId_locationId_key" ON "ProductInventory"("businessId", "productId", "locationId");

-- CreateIndex
CREATE INDEX "ProductRecommendation_businessId_serviceId_status_priority_idx" ON "ProductRecommendation"("businessId", "serviceId", "status", "priority");

-- CreateIndex
CREATE INDEX "ProductRecommendation_businessId_productId_status_idx" ON "ProductRecommendation"("businessId", "productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRecommendation_businessId_serviceId_productId_key" ON "ProductRecommendation"("businessId", "serviceId", "productId");

-- CreateIndex
CREATE INDEX "ProductInquiry_businessId_productId_status_createdAt_idx" ON "ProductInquiry"("businessId", "productId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProductInquiry_businessId_locationId_status_createdAt_idx" ON "ProductInquiry"("businessId", "locationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProductInquiry_businessId_appointmentId_idx" ON "ProductInquiry"("businessId", "appointmentId");

-- CreateIndex
CREATE INDEX "ProductInquiry_businessId_customerId_createdAt_idx" ON "ProductInquiry"("businessId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "RetailOrder_businessId_locationId_status_createdAt_idx" ON "RetailOrder"("businessId", "locationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "RetailOrder_businessId_customerId_createdAt_idx" ON "RetailOrder"("businessId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "RetailOrder_businessId_appointmentId_idx" ON "RetailOrder"("businessId", "appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "RetailOrder_businessId_id_key" ON "RetailOrder"("businessId", "id");

-- CreateIndex
CREATE INDEX "RetailOrderItem_businessId_productId_idx" ON "RetailOrderItem"("businessId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "RetailOrderItem_businessId_retailOrderId_sequence_key" ON "RetailOrderItem"("businessId", "retailOrderId", "sequence");

-- CreateIndex
CREATE INDEX "ResourceType_businessId_status_idx" ON "ResourceType"("businessId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceType_businessId_slug_key" ON "ResourceType"("businessId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceType_businessId_id_key" ON "ResourceType"("businessId", "id");

-- CreateIndex
CREATE INDEX "Resource_businessId_locationId_status_idx" ON "Resource"("businessId", "locationId", "status");

-- CreateIndex
CREATE INDEX "Resource_businessId_resourceTypeId_status_idx" ON "Resource"("businessId", "resourceTypeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_businessId_locationId_slug_key" ON "Resource"("businessId", "locationId", "slug");

-- CreateIndex
CREATE INDEX "ServiceResourceRequirement_businessId_resourceTypeId_idx" ON "ServiceResourceRequirement"("businessId", "resourceTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceResourceRequirement_businessId_serviceId_resourceTyp_key" ON "ServiceResourceRequirement"("businessId", "serviceId", "resourceTypeId");

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_businessId_categoryId_fkey" FOREIGN KEY ("businessId", "categoryId") REFERENCES "ProductCategory"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventory" ADD CONSTRAINT "ProductInventory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventory" ADD CONSTRAINT "ProductInventory_businessId_productId_fkey" FOREIGN KEY ("businessId", "productId") REFERENCES "Product"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventory" ADD CONSTRAINT "ProductInventory_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "Location"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRecommendation" ADD CONSTRAINT "ProductRecommendation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRecommendation" ADD CONSTRAINT "ProductRecommendation_businessId_serviceId_fkey" FOREIGN KEY ("businessId", "serviceId") REFERENCES "Service"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRecommendation" ADD CONSTRAINT "ProductRecommendation_businessId_productId_fkey" FOREIGN KEY ("businessId", "productId") REFERENCES "Product"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInquiry" ADD CONSTRAINT "ProductInquiry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInquiry" ADD CONSTRAINT "ProductInquiry_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "Location"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInquiry" ADD CONSTRAINT "ProductInquiry_businessId_productId_fkey" FOREIGN KEY ("businessId", "productId") REFERENCES "Product"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInquiry" ADD CONSTRAINT "ProductInquiry_businessId_serviceId_fkey" FOREIGN KEY ("businessId", "serviceId") REFERENCES "Service"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInquiry" ADD CONSTRAINT "ProductInquiry_businessId_appointmentId_fkey" FOREIGN KEY ("businessId", "appointmentId") REFERENCES "Appointment"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInquiry" ADD CONSTRAINT "ProductInquiry_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "Customer"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailOrder" ADD CONSTRAINT "RetailOrder_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailOrder" ADD CONSTRAINT "RetailOrder_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "Location"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailOrder" ADD CONSTRAINT "RetailOrder_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "Customer"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailOrder" ADD CONSTRAINT "RetailOrder_businessId_appointmentId_fkey" FOREIGN KEY ("businessId", "appointmentId") REFERENCES "Appointment"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailOrderItem" ADD CONSTRAINT "RetailOrderItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailOrderItem" ADD CONSTRAINT "RetailOrderItem_businessId_retailOrderId_fkey" FOREIGN KEY ("businessId", "retailOrderId") REFERENCES "RetailOrder"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailOrderItem" ADD CONSTRAINT "RetailOrderItem_businessId_productId_fkey" FOREIGN KEY ("businessId", "productId") REFERENCES "Product"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceType" ADD CONSTRAINT "ResourceType_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "Location"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_businessId_resourceTypeId_fkey" FOREIGN KEY ("businessId", "resourceTypeId") REFERENCES "ResourceType"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResourceRequirement" ADD CONSTRAINT "ServiceResourceRequirement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResourceRequirement" ADD CONSTRAINT "ServiceResourceRequirement_businessId_serviceId_fkey" FOREIGN KEY ("businessId", "serviceId") REFERENCES "Service"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResourceRequirement" ADD CONSTRAINT "ServiceResourceRequirement_businessId_resourceTypeId_fkey" FOREIGN KEY ("businessId", "resourceTypeId") REFERENCES "ResourceType"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain integrity checks not expressible in Prisma schema
ALTER TABLE "ProductCategory"
  ADD CONSTRAINT "ProductCategory_sortOrder_check" CHECK ("sortOrder" >= 0);

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_priceClp_check" CHECK ("priceClp" >= 0),
  ADD CONSTRAINT "Product_sortOrder_check" CHECK ("sortOrder" >= 0);

-- This stronger invariant also satisfies tracked inventory: 0 <= reserved <= onHand.
ALTER TABLE "ProductInventory"
  ADD CONSTRAINT "ProductInventory_onHand_check" CHECK ("onHand" >= 0),
  ADD CONSTRAINT "ProductInventory_reserved_check" CHECK ("reserved" >= 0 AND "reserved" <= "onHand"),
  ADD CONSTRAINT "ProductInventory_reorderPoint_check" CHECK ("reorderPoint" >= 0);

ALTER TABLE "ProductRecommendation"
  ADD CONSTRAINT "ProductRecommendation_priority_check" CHECK ("priority" >= 0);

ALTER TABLE "RetailOrder"
  ADD CONSTRAINT "RetailOrder_totalClp_check" CHECK ("totalClp" >= 0);

ALTER TABLE "RetailOrderItem"
  ADD CONSTRAINT "RetailOrderItem_sequence_check" CHECK ("sequence" >= 0),
  ADD CONSTRAINT "RetailOrderItem_unitPrice_check" CHECK ("unitPriceClpSnapshot" >= 0),
  ADD CONSTRAINT "RetailOrderItem_quantity_check" CHECK ("quantity" > 0),
  ADD CONSTRAINT "RetailOrderItem_totalClp_check" CHECK ("totalClpSnapshot" >= 0);

ALTER TABLE "Resource"
  ADD CONSTRAINT "Resource_capacity_check" CHECK ("capacity" > 0);

ALTER TABLE "ServiceResourceRequirement"
  ADD CONSTRAINT "ServiceResourceRequirement_quantity_check" CHECK ("quantity" > 0);
