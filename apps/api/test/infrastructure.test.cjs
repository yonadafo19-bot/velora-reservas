const assert = require("node:assert/strict");
const { test } = require("node:test");

const { AuditWriterService } = require("../dist/common/audit/audit-writer.service.js");
const {
  NestedTransactionError,
  TransactionService,
} = require("../dist/common/database/transaction.service.js");
const { TenantScopeService } = require("../dist/common/repositories/tenant-scope.service.js");

function tenantContext(businessId = "business-1") {
  return {
    businessId,
    businessSlug: "negocio-autorizado",
    businessName: "Negocio autorizado",
    businessVertical: "BARBERSHOP",
    membershipId: "membership-1",
    role: "ADMIN",
    userId: "user-1",
  };
}

test("el helper rechaza la ausencia de contexto tenant", () => {
  const scope = new TenantScopeService({ get: () => undefined });

  assert.throws(
    () => scope.requireTenantContext(),
    (error) => error.getStatus() === 403
      && error.getResponse().code === "TENANT_CONTEXT_REQUIRED",
  );
});

test("el helper rechaza un businessId distinto", () => {
  const scope = new TenantScopeService({ get: () => tenantContext() });

  assert.throws(
    () => scope.assertSameBusinessId("business-2"),
    (error) => error.getStatus() === 403
      && error.getResponse().code === "TENANT_BUSINESS_MISMATCH",
  );
});

test("tenantWhere impone businessId aunque el filtro intente reemplazarlo", () => {
  const scope = new TenantScopeService({ get: () => tenantContext() });

  assert.deepEqual(
    scope.tenantWhere({ id: "entity-1", businessId: "business-2" }),
    { id: "entity-1", businessId: "business-1" },
  );
});

test("AuditWriter exige businessId del tenant y redacta secretos", () => {
  const scope = new TenantScopeService({ get: () => tenantContext() });
  const writer = new AuditWriterService(scope, {
    getRequestId: () => "request-1",
  });
  const event = {
    actorType: "ADMIN",
    actorId: "user-1",
    entityType: "SERVICE",
    entityId: "service-1",
    action: "UPDATED",
  };

  assert.throws(
    () => writer.prepare(event),
    (error) => error.getStatus() === 403
      && error.getResponse().code === "TENANT_BUSINESS_MISMATCH",
  );

  const prepared = writer.prepare({
    ...event,
    businessId: "business-1",
    metadataJson: {
      access_token: "no-debe-persistirse",
      safe: "visible",
    },
  });
  assert.equal(prepared.requestId, "request-1");
  assert.equal(prepared.metadataJson.access_token, "[REDACTED]");
  assert.equal(prepared.metadataJson.safe, "visible");
});

test("TransactionService propaga el error original", async () => {
  const expected = new Error("fallo de dominio");
  const transaction = { marker: "tx" };
  const database = {
    getClient: () => ({
      $transaction: (callback) => callback(transaction),
    }),
  };
  const service = new TransactionService(database);

  await assert.rejects(
    service.runInTransaction(async () => { throw expected; }),
    (error) => error === expected,
  );
});

test("TransactionService rechaza transacciones anidadas implícitas", async () => {
  const transaction = { marker: "tx" };
  const database = {
    getClient: () => ({
      $transaction: (callback) => callback(transaction),
    }),
  };
  const service = new TransactionService(database);

  await assert.rejects(
    service.runInTransaction(() => service.runInTransaction(async () => undefined)),
    (error) => error instanceof NestedTransactionError
      && error.code === "NESTED_TRANSACTION_NOT_ALLOWED",
  );
});
