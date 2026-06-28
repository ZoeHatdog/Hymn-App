export interface ParsedHymnFile {
  title: string;
  author: string;
  imageFolder: string | null;
  tags: string[];
  library: string | null;
  link: string | null;
  lyrics: string;
}

/** Strips inline `-- comment` suffixes from metadata values. */
export function stripMetadataComment(value: string): string {
  return value.replace(/\s*--.*$/, "").trim();
}

/** Parses a comma-separated tags metadata value into individual tags. */
export function parseTagsValue(raw: string): string[] {
  const cleaned = stripMetadataComment(raw);
  if (!cleaned) {
    return [];
  }

  return cleaned
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/** Lowercase space-joined tags for case-insensitive partial search. */
export function buildTagsSearchText(tags: string[]): string {
  return tags.map((tag) => tag.toLowerCase()).join(" ");
}

export function parseHymnFile(content: string): ParsedHymnFile {
  const lines = content.split(/\r?\n/);
  let title = "Untitled";
  let author = "Unknown";
  let imageFolder: string | null = null;
  let tags: string[] = [];
  let library: string | null = null;
  let link: string | null = null;
  const lyricsLines: string[] = [];
  let inLyrics = false;

  for (const line of lines) {
    if (!inLyrics) {
      if (line.startsWith("title:")) {
        title = stripMetadataComment(line.replace("title:", ""));
        continue;
      }
      if (line.startsWith("author:")) {
        author = stripMetadataComment(line.replace("author:", ""));
        continue;
      }
      if (line.startsWith("image_folder:")) {
        imageFolder = stripMetadataComment(line.replace("image_folder:", "")) || null;
        continue;
      }
      if (line.startsWith("tags:")) {
        tags = parseTagsValue(line.replace("tags:", ""));
        continue;
      }
      if (line.startsWith("library:")) {
        library = stripMetadataComment(line.replace("library:", "")) || null;
        continue;
      }
      if (line.startsWith("link:")) {
        link = stripMetadataComment(line.replace("link:", "")) || null;
        continue;
      }
      if (line.trim() === "" || line.startsWith("--")) {
        if (line.trim() === "") {
          inLyrics = true;
        }
        continue;
      }
    } else {
      if (line.startsWith("--")) {
        continue;
      }
      lyricsLines.push(line);
    }
  }

  while (lyricsLines.length > 0 && lyricsLines[0].trim() === "") {
    lyricsLines.shift();
  }

  return {
    title,
    author,
    imageFolder,
    tags,
    library,
    link,
    lyrics: lyricsLines.join("\n").trim(),
  };
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function sanitizeSearchQuery(query: string): string {
  return query.trim().slice(0, 100);
}
