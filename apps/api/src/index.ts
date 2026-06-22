import "dotenv/config";
import { join } from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { hymnRoutes } from "./routes/hymns.js";

const port = Number(process.env.API_PORT ?? 3000);
const host = process.env.API_HOST ?? "0.0.0.0";

const imagesDir = join(process.cwd(), "..", "..", "data", "hymns", "images");

async function start() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(fastifyStatic, {
    root: imagesDir,
    prefix: "/api/assets/hymns/",
    decorateReply: false,
  });
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
