import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { hymnRoutes } from "./routes/hymns.js";

const port = Number(process.env.API_PORT ?? 3000);
const host = process.env.API_HOST ?? "0.0.0.0";

async function start() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(hymnRoutes, { prefix: "/api" });

  app.get("/health", async () => ({ status: "ok" }));

  try {
    await app.listen({ port, host });
    console.log(`API running at http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
