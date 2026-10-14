import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type ErrorRequestHandler } from "express";
import { hymnRoutes } from "./routes/hymns.js";

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.static(publicDir));

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api", hymnRoutes);

  const invalidJson: ErrorRequestHandler = (error, _request, response, next) => {
    if (error instanceof SyntaxError) {
      response.status(400).json({ success: false, error: "Request body must be JSON." });
      return;
    }
    next(error);
  };
  app.use(invalidJson);

  return app;
}
