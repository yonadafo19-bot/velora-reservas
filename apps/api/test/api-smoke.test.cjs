const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const net = require("node:net");
const { after, before, test } = require("node:test");

let apiProcess;
let baseUrl;

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function waitUntilReady(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${url}/api/v1/health/live`);
      if (response.ok) return;
    } catch {
      // La API aun esta iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("La API no inicio dentro del tiempo esperado.");
}

before(async () => {
  const port = await reservePort();
  baseUrl = `http://127.0.0.1:${port}`;
  const environment = {
    ...process.env,
    PORT: String(port),
    AUTH_REQUIRED: "false",
    DATABASE_URL: "",
    SUPABASE_PROJECT_URL: "",
    SUPABASE_ISSUER_URL: "",
    SUPABASE_JWKS_URL: "",
  };
  apiProcess = spawn(process.execPath, ["dist/main.js"], {
    cwd: process.cwd(),
    env: environment,
    stdio: "ignore",
  });
  await waitUntilReady(baseUrl);
});

after(() => {
  apiProcess?.kill();
});

test("health live y ready permanecen publicos", async () => {
  const [live, ready] = await Promise.all([
    fetch(`${baseUrl}/api/v1/health/live`),
    fetch(`${baseUrl}/api/v1/health/ready`),
  ]);
  assert.equal(live.status, 200);
  assert.equal(ready.status, 200);
});

test("auth/me sin token devuelve usuario dev cuando AUTH_REQUIRED=false", async () => {
  const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
    headers: { "x-request-id": "test-auth-missing" },
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-request-id"), "test-auth-missing");
  assert.equal(body.userId, "seed-user-demo-owner");
  assert.equal(
    body.memberships.some((membership) => membership.businessSlug === "barberia"),
    true,
  );
});

test("auth/me con token local no valida JWT cuando AUTH_REQUIRED=false", async () => {
  const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
    headers: {
      authorization: "Bearer local-dev-token",
      "x-request-id": "test-auth-invalid",
    },
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.userId, "seed-user-demo-owner");
});
