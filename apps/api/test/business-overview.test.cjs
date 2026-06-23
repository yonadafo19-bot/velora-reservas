const assert = require("node:assert/strict");
const { test } = require("node:test");

const { BusinessOverviewService } = require("../dist/businesses/business-overview.service.js");

function tenantContext() {
  return {
    businessId: "business-1",
    businessSlug: "velora-barberia-demo",
    businessName: "Velora Barberia Demo",
    businessVertical: "BARBERSHOP",
    membershipId: "membership-1",
    role: "OWNER",
    userId: "user-1",
    email: "owner@example.invalid",
    authSubject: "supabase-subject",
    requestId: "request-1",
  };
}

test("business overview responde el shape tenant esperado", () => {
  const service = new BusinessOverviewService();

  assert.deepEqual(service.getOverview(tenantContext()), {
    business: {
      id: "business-1",
      slug: "velora-barberia-demo",
      name: "Velora Barberia Demo",
      vertical: "BARBERSHOP",
    },
    membership: {
      role: "OWNER",
    },
  });
});

test("business overview no expone campos sensibles del contexto", () => {
  const service = new BusinessOverviewService();
  const responseJson = JSON.stringify(service.getOverview(tenantContext()));

  assert.equal(responseJson.includes("userId"), false);
  assert.equal(responseJson.includes("membershipId"), false);
  assert.equal(responseJson.includes("email"), false);
  assert.equal(responseJson.includes("authSubject"), false);
  assert.equal(responseJson.includes("requestId"), false);
});
