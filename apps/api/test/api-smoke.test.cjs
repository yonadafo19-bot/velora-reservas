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
      // La API aún está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("La API no inició dentro del tiempo esperado.");
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

test("health live y ready permanecen públicos", async () => {
  const [live, ready] = await Promise.all([
    fetch(`${baseUrl}/api/v1/health/live`),
    fetch(`${baseUrl}/api/v1/health/ready`),
  ]);
  assert.equal(live.status, 200);
  assert.equal(ready.status, 200);
});

test("auth/me sin token devuelve 401 y propaga requestId", async () => {
  const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
    headers: { "x-request-id": "test-auth-missing" },
  });
  const body = await response.json();
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("x-request-id"), "test-auth-missing");
  assert.equal(body.requestId, "test-auth-missing");
  assert.equal(body.code, "AUTH_TOKEN_MISSING");
});

test("auth/me con token inválido devuelve 401 estable", async () => {
  const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
    headers: {
      authorization: "Bearer token-invalido",
      "x-request-id": "test-auth-invalid",
    },
  });
  const body = await response.json();
  assert.equal(response.status, 401);
  assert.equal(body.code, "AUTH_TOKEN_INVALID");
  assert.equal(body.requestId, "test-auth-invalid");
});
