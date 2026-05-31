import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { migrate } from "./db.js";
import { categoriesRouter } from "./routes/categories.js";
import { entriesRouter } from "./routes/entries.js";
import { statsRouter } from "./routes/stats.js";
import { tasksRouter } from "./routes/tasks.js";
import { fail } from "./utils.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

migrate();

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
app.use("/api/entries", entriesRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/stats", statsRouter);
app.use("/api", categoriesRouter);

app.use((_req, res) => fail(res, "Route not found", 404));

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  fail(res, error instanceof Error ? error.message : "Unexpected server error", 500);
});

app.listen(port, () => {
  console.log(`Learning Journal API running at http://localhost:${port}`);
});
