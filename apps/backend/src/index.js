const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "backend" });
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
