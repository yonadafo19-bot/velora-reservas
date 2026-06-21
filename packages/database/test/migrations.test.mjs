import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const concurrencyMigrationUrl = new URL(
  "../prisma/migrations/20260620140000_add_multi_service_appointments_availability_constraints/migration.sql",
  import.meta.url,
);
const inventoryMigrationUrl = new URL(
  "../prisma/migrations/20260620170000_add_audit_status_history_inventory_movements/migration.sql",
  import.meta.url,
);
const productInventoryMigrationUrl = new URL(
  "../prisma/migrations/20260620160000_add_product_inventory_retail_resources/migration.sql",
  import.meta.url,
);

test("la migración protege traslapes profesionales con rango semiabierto", async () => {
  const sql = await readFile(concurrencyMigrationUrl, "utf8");

  assert.match(sql, /CREATE EXTENSION IF NOT EXISTS btree_gist;/);
  assert.match(sql, /EXCLUDE USING gist\s*\(/);
  assert.match(sql, /"businessId" WITH =/);
  assert.match(sql, /"professionalId" WITH =/);
  assert.match(sql, /tstzrange\("startsAt", "endsAt", '\[\)'\) WITH &&/);
  assert.match(sql, /"blocksAvailability" = true/);
  assert.match(sql, /"status" <> 'CANCELLED'/);
});

test("InventoryMovement mantiene idempotencia opcional por tenant", async () => {
  const sql = await readFile(inventoryMigrationUrl, "utf8");

  assert.match(sql, /"idempotencyKey" VARCHAR\(128\),/);
  assert.match(
    sql,
    /CREATE UNIQUE INDEX "InventoryMovement_businessId_idempotencyKey_key" ON "InventoryMovement"\("businessId", "idempotencyKey"\);/,
  );
  assert.doesNotMatch(sql, /NULLS NOT DISTINCT/);
});

test("InventoryMovement impide stock negativo y reservas sobre stock", async () => {
  const sql = await readFile(inventoryMigrationUrl, "utf8");

  assert.match(sql, /CHECK \("previousOnHand" >= 0\)/);
  assert.match(sql, /CHECK \("nextOnHand" >= 0\)/);
  assert.match(sql, /"previousReserved" >= 0 AND "previousReserved" <= "previousOnHand"/);
  assert.match(sql, /"nextReserved" >= 0 AND "nextReserved" <= "nextOnHand"/);
});

test("ProductInventory exige reserved entre cero y onHand", async () => {
  const sql = await readFile(productInventoryMigrationUrl, "utf8");

  assert.match(sql, /CHECK \("onHand" >= 0\)/);
  assert.match(sql, /CHECK \("reserved" >= 0 AND "reserved" <= "onHand"\)/);
});
