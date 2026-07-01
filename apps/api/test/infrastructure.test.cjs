const assert = require("node:assert/strict");
const { test } = require("node:test");

const { Logger } = require("@nestjs/common");
const { AuditWriterService } = require("../dist/common/audit/audit-writer.service.js");
const { HttpErrorFilter } = require("../dist/common/filters/http-error.filter.js");
const { RequestContextService } = require("../dist/common/request-context/request-context.service.js");
const {
  NestedTransactionError,
  TransactionService,
} = require("../dist/common/database/transaction.service.js");
const { BaseTenantRepository } = require("../dist/common/repositories/base-tenant.repository.js");
const { LocationAccessRepository } = require("../dist/common/repositories/location-access.repository.js");
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

test("HttpErrorFilter registra errores internos con requestId y datos sanitizados", () => {
  const logs = [];
  const replies = [];
  const originalError = Logger.prototype.error;
  Logger.prototype.error = function error(message) {
    logs.push(String(message));
  };

  try {
    const filter = new HttpErrorFilter(
      {
        httpAdapter: {
          reply: (_response, body, status) => {
            replies.push({ body, status });
          },
        },
      },
      { getRequestId: () => "request-safe-1" },
    );
    const error = new Error(
      "fallo inesperado token=secret-value Authorization: Bearer abc123 cookie=session database_url=postgres://user:pass@localhost/db",
    );
    error.name = "PrismaClientKnownRequestError";
    error.code = "P2000";
    error.meta = {
      target: ["phone"],
      token: "secret-value",
      nested: {
        authorization: "Bearer abc123",
        safe: "visible",
      },
    };

    filter.catch(error, {
      switchToHttp: () => ({
        getResponse: () => ({}),
      }),
    });
  } finally {
    Logger.prototype.error = originalError;
  }

  assert.equal(replies[0].status, 500);
  assert.equal(replies[0].body.code, "INTERNAL_SERVER_ERROR");
  assert.equal(replies[0].body.requestId, "request-safe-1");
  assert.equal(replies[0].body.message, "Ocurrió un error interno.");
  assert.equal(logs.length, 1);

  const logEntry = JSON.parse(logs[0]);
  assert.equal(logEntry.requestId, "request-safe-1");
  assert.equal(logEntry.errorName, "PrismaClientKnownRequestError");
  assert.equal(logEntry.errorCode, "P2000");
  assert.deepEqual(logEntry.errorMeta.target, ["phone"]);
  assert.equal(logEntry.errorMeta.token, "[redacted]");
  assert.equal(logEntry.errorMeta.nested.authorization, "[redacted]");
  assert.equal(logEntry.errorMeta.nested.safe, "visible");
  assert.ok(logEntry.message.length <= 300);

  const serializedLog = logs.join("\n");
  assert.equal(serializedLog.includes("secret-value"), false);
  assert.equal(serializedLog.includes("abc123"), false);
  assert.equal(serializedLog.includes("session"), false);
  assert.equal(serializedLog.includes("postgres://"), false);
});

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

test("el repositorio base siempre construye where con businessId", () => {
  class TestRepository extends BaseTenantRepository {
    where(input) { return this.whereForTenant(input); }
  }

  const scope = new TenantScopeService({ get: () => tenantContext() });
  const repository = new TestRepository(scope);
  assert.deepEqual(repository.where({ status: "ACTIVE" }), {
    status: "ACTIVE",
    businessId: "business-1",
  });
});

test("la validación de location consulta businessId y locationId", async () => {
  const scope = new TenantScopeService({ get: () => tenantContext() });
  const repository = new LocationAccessRepository(scope);
  let receivedWhere;
  const transaction = {
    location: {
      findFirst: ({ where }) => {
        receivedWhere = where;
        return Promise.resolve({ id: "location-1", businessId: "business-1" });
      },
    },
  };

  await repository.assertLocationBelongsToBusiness(transaction, "location-1");
  assert.deepEqual(receivedWhere, {
    id: "location-1",
    businessId: "business-1",
  });
});

test("AuditWriter exige businessId del tenant y redacta secretos", () => {
  const scope = new TenantScopeService({ get: () => tenantContext() });
  const writer = new AuditWriterService(scope, {
    getRequestId: () => "request-1",
  }, { assertLocationBelongsToBusiness: () => Promise.resolve() });
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
    beforeJson: { password: "oculta", visible: "antes" },
    afterJson: { secret: "oculto", visible: "después" },
    metadataJson: {
      access_token: "oculto",
      cookie: "oculta",
      authorization: "oculta",
      credential: "oculta",
      nested: { private_key: "oculta", safe: "visible" },
    },
  });
  assert.equal(prepared.requestId, "request-1");
  assert.equal(prepared.beforeJson.password, "[REDACTED]");
  assert.equal(prepared.afterJson.secret, "[REDACTED]");
  assert.equal(prepared.metadataJson.access_token, "[REDACTED]");
  assert.equal(prepared.metadataJson.cookie, "[REDACTED]");
  assert.equal(prepared.metadataJson.authorization, "[REDACTED]");
  assert.equal(prepared.metadataJson.credential, "[REDACTED]");
  assert.equal(prepared.metadataJson.nested.private_key, "[REDACTED]");
  assert.equal(prepared.metadataJson.nested.safe, "visible");
});

test("AuditWriter usa el tx recibido y valida location antes de escribir", async () => {
  const scope = new TenantScopeService({ get: () => tenantContext() });
  const calls = [];
  const writer = new AuditWriterService(
    scope,
    { getRequestId: () => "request-2" },
    {
      assertLocationBelongsToBusiness: async (transaction, locationId) => {
        calls.push(["location", transaction, locationId]);
      },
    },
  );
  const transaction = {
    auditLog: {
      create: async ({ data }) => {
        calls.push(["audit", data]);
        return { id: "audit-1", ...data };
      },
    },
  };
  const event = {
    businessId: "business-1",
    locationId: "location-1",
    actorType: "ADMIN",
    entityType: "SERVICE",
    entityId: "service-1",
    action: "UPDATED",
  };

  await writer.write(transaction, event);
  assert.equal(calls[0][0], "location");
  assert.equal(calls[0][1], transaction);
  assert.equal(calls[0][2], "location-1");
  assert.equal(calls[1][0], "audit");

  await assert.rejects(() => writer.write(undefined, { ...event, locationId: undefined }));
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

test("TransactionService conserva requestId y entrega el mismo tx al callback", async () => {
  const transaction = { marker: "tx-context" };
  const database = {
    getClient: () => ({
      $transaction: (callback) => callback(transaction),
    }),
  };
  const service = new TransactionService(database);
  const requestContext = new RequestContextService();

  await new Promise((resolve, reject) => {
    requestContext.run("request-preserved", () => {
      service.runInTransaction(async (receivedTransaction) => {
        assert.equal(receivedTransaction, transaction);
        assert.equal(requestContext.getRequestId(), "request-preserved");
      }).then(resolve, reject);
    });
  });
});
