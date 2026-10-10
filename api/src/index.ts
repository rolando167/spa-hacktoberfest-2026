import { serve } from "@hono/node-server";

import { app } from "./app.js";

const port = Number.parseInt(process.env["PORT"] ?? "3000", 10);

serve({ fetch: app.fetch, port });
console.info(`Madrid hidden-places API listening on http://localhost:${port}`);
