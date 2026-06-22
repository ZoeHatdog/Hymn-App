import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Hymn, HymnSummary } from "@hymn-app/shared-types";
import { sanitizeSearchQuery } from "@hymn-app/shared-utils";
import { prisma } from "../db.js";

function toHymnSummary(hymn: {
  id: string;
  title: string;
  author: string;
}): HymnSummary {
  return {
    id: hymn.id,
    title: hymn.title,
    author: hymn.author,
  };
}

function buildImageUrl(request: FastifyRequest, imagePath: string): string | null {
  const host = request.headers.host;
  if (!host) {
    return null;
  }

  const encodedPath = imagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${request.protocol}://${host}/api/assets/hymns/${encodedPath}`;
}

function buildImageUrls(request: FastifyRequest, imagePaths: string[]): string[] {
  return imagePaths
    .map((path) => buildImageUrl(request, path))
    .filter((url): url is string => url !== null);
}

function toHymn(
  request: FastifyRequest,
  hymn: {
    id: string;
    title: string;
    author: string;
    lyrics: string;
    imagePaths: string[];
    createdAt: Date;
    updatedAt: Date;
  },
): Hymn {
  return {
    id: hymn.id,
    title: hymn.title,
    author: hymn.author,
    lyrics: hymn.lyrics,
    imageUrls: buildImageUrls(request, hymn.imagePaths),
    createdAt: hymn.createdAt.toISOString(),
    updatedAt: hymn.updatedAt.toISOString(),
  };
}

export async function hymnRoutes(app: FastifyInstance) {
  app.get("/hymns", async () => {
    const hymns = await prisma.hymn.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, author: true },
    });

    return {
      success: true,
      data: hymns.map(toHymnSummary),
    };
  });

  app.get<{ Querystring: { q?: string } }>("/hymns/search", async (request) => {
    const query = sanitizeSearchQuery(request.query.q ?? "");

    if (!query) {
      return { success: true, data: [] };
    }

    const hymns = await prisma.hymn.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { author: { contains: query, mode: "insensitive" } },
          { lyrics: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { title: "asc" },
      select: { id: true, title: true, author: true },
    });

    return {
      success: true,
      data: hymns.map(toHymnSummary),
    };
  });

  app.get<{ Params: { id: string } }>("/hymns/:id", async (request, reply) => {
    const hymn = await prisma.hymn.findUnique({
      where: { id: request.params.id },
    });

    if (!hymn) {
      return reply.status(404).send({
        success: false,
        error: "Hymn not found",
      });
    }

    return {
      success: true,
      data: toHymn(request, hymn),
    };
  });
}
