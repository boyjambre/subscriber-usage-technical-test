const express = require("express");

function createApp({ usageStore = [] } = {}) {
  const app = express();
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.post("/api/usage", (req, res) => {
    const { subscriberId, callMinutes, smsCount, dataUsageMB } = req.body ?? {};
    const errors = [];

    if (typeof subscriberId !== "string" || subscriberId.trim() === "") {
      errors.push("subscriberId must be a non-empty string");
    }
    for (const [field, value] of Object.entries({ callMinutes, smsCount, dataUsageMB })) {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        errors.push(`${field} must be a non-negative number`);
      }
    }
    if (Number.isFinite(smsCount) && !Number.isInteger(smsCount)) {
      errors.push("smsCount must be an integer");
    }

    if (errors.length) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid request body", details: errors }
      });
    }

    const record = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
      subscriberId: subscriberId.trim(),
      callMinutes,
      smsCount,
      dataUsageMB,
      timestamp: new Date().toISOString()
    };
    usageStore.push(record);
    return res.status(201).json({ data: record });
  });

  app.get("/api/usage", (req, res) => {
    const { subscriberId } = req.query;
    const data = subscriberId
      ? usageStore.filter((record) => record.subscriberId === String(subscriberId))
      : usageStore;
    return res.status(200).json({ count: data.length, data });
  });

  app.get("/api/usage/:subscriberId", (req, res) => {
    const data = usageStore.filter((record) => record.subscriberId === req.params.subscriberId);
    return res.status(200).json({ subscriberId: req.params.subscriberId, count: data.length, data });
  });

  app.use((err, _req, res, _next) => {
    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({
        error: { code: "INVALID_JSON", message: "Request body must contain valid JSON" }
      });
    }
    console.error(err);
    return res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" }
    });
  });

  return app;
}

module.exports = { createApp };
