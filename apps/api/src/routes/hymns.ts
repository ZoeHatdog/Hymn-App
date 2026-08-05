import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Hymn, HymnSummary } from "@hymn-app/shared-types";
import {
  compareHymnsByLibraryAndPage,
  sanitizeSearchQuery,
} from "@hymn-app/shared-utils";
import { prisma } from "../db.js";

function toHymnSummary(hymn: {
  id: string;
  title: string;
  author: string;
  library: string | null;
  page: number | null;
}): HymnSummary {
  return {
    id: hymn.id,
    title: hymn.title,
    author: hymn.author,
    library: hymn.library,
    page: hymn.page,
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
    tags: string[];
    library: string | null;
    page: number | null;
    link: string | null;
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
    tags: hymn.tags,
    library: hymn.library,
    page: hymn.page,
    link: hymn.link,
    createdAt: hymn.createdAt.toISOString(),
    updatedAt: hymn.updatedAt.toISOString(),
  };
}

const summarySelect = {
  id: true,
  title: true,
  author: true,
  library: true,
  page: true,
} as const;

export async function hymnRoutes(app: FastifyInstance) {
  app.get("/hymns", async () => {
    const hymns = await prisma.hymn.findMany({
      select: summarySelect,
    });

    hymns.sort(compareHymnsByLibraryAndPage);

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

    const tagQuery = query.toLowerCase();

    const hymns = await prisma.hymn.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { author: { contains: query, mode: "insensitive" } },
          { lyrics: { contains: query, mode: "insensitive" } },
          { library: { contains: query, mode: "insensitive" } },
          { tagsSearch: { contains: tagQuery } },
        ],
      },
      select: summarySelect,
    });

    hymns.sort(compareHymnsByLibraryAndPage);

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
