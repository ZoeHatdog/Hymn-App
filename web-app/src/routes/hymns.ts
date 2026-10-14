import { Router } from "express";
import { config } from "../config.js";
import type { ApiFailure, ApiSuccess, HymnDraft, HymnSummary } from "../types.js";

export const hymnRoutes = Router();

hymnRoutes.get("/hymns", async (_request, response) => {
  try {
    const upstream = await fetch(`${config.apiBaseUrl}/api/hymns`);
    if (!upstream.ok) {
      const failure: ApiFailure = {
        success: false,
        error: `Hymn API responded with ${upstream.status}`,
      };
      response.status(502).json(failure);
      return;
    }

    const body = (await upstream.json()) as ApiSuccess<HymnSummary[]>;
    response.json(body);
  } catch {
    const failure: ApiFailure = {
      success: false,
      error: "Could not reach the hymn API. Start it with npm run api from the repo root.",
    };
    response.status(502).json(failure);
  }
});

hymnRoutes.post("/hymns", (request, response) => {
  const draft = readDraft(request.body);
  if (!draft) {
    const failure: ApiFailure = {
      success: false,
      error: "Title, author, and lyrics are required.",
    };
    response.status(400).json(failure);
    return;
  }

  const failure: ApiFailure = {
    success: false,
    error: "The hymn was not saved. Adding hymns is not connected to the library yet.",
  };
  response.status(501).json(failure);
});

hymnRoutes.delete("/hymns/:id", (request, response) => {
  const id = request.params.id?.trim();
  if (!id) {
    const failure: ApiFailure = {
      success: false,
      error: "A hymn id is required.",
    };
    response.status(400).json(failure);
    return;
  }

  const failure: ApiFailure = {
    success: false,
    error: "That hymn was not deleted. Deleting hymns is not connected to the library yet.",
  };
  response.status(501).json(failure);
});

function readDraft(body: unknown): HymnDraft | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const title = readString(record.title);
  const author = readString(record.author);
  const lyrics = readString(record.lyrics);
  if (!title || !author || !lyrics) {
    return null;
  }

  const pageRaw = readString(record.page);
  const page = pageRaw ? Number(pageRaw) : null;

  return {
    title,
    author,
    lyrics,
    library: readString(record.library) || null,
    page: page !== null && Number.isInteger(page) ? page : null,
    tags: readString(record.tags)
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0),
    link: readString(record.link) || null,
  };
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
