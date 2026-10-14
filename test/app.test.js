const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");

async function withServer(fn) {
  const store = [];
  const server = createApp({ usageStore: store }).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(url, store);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("health endpoint returns ok", async () => {
  await withServer(async (url) => {
    const response = await fetch(`${url}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  });
});

test("creates and retrieves usage records", async () => {
  await withServer(async (url) => {
    const response = await fetch(`${url}/api/usage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subscriberId: "SUB01", callMinutes: 40, smsCount: 10, dataUsageMB: 1500
      })
    });
    assert.equal(response.status, 201);
    const created = await response.json();
    assert.equal(created.data.subscriberId, "SUB01");

    const listResponse = await fetch(`${url}/api/usage?subscriberId=SUB01`);
    const list = await listResponse.json();
    assert.equal(list.count, 1);
    assert.equal(list.data[0].dataUsageMB, 1500);
  });
});

test("rejects invalid usage values", async () => {
  await withServer(async (url) => {
    const response = await fetch(`${url}/api/usage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subscriberId: "", callMinutes: -1, smsCount: 2.5, dataUsageMB: "1500"
      })
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.error.code, "VALIDATION_ERROR");
    assert.ok(payload.error.details.length >= 3);
  });
});

test("CSV output escapes commas, quotes, and newlines", () => {
  const { toCsv } = require("../scripts/snapshot");
  const csv = toCsv([{
    id: "1", subscriberId: 'SUB,"01', callMinutes: 1, smsCount: 2,
    dataUsageMB: 3, timestamp: "2025-08-01T08:00:00.000Z"
  }]);
  assert.match(csv, /"SUB,""01"/);
});
