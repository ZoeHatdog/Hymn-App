export interface ParsedHymnFile {
  title: string;
  author: string;
  imageFolder: string | null;
  imageFile: string | null;
  tags: string[];
  library: string | null;
  page: number | null;
  link: string | null;
  lyrics: string;
}

/** Preferred library order for catalog sorting; unknown libraries follow these. */
const LIBRARY_SORT_ORDER = ["rejoice", "tbc"];

export interface HymnSortFields {
  title: string;
  library: string | null;
  page: number | null;
}

/**
 * Sort key for libraries: Rejoice, then TBC, then other named libraries,
 * then hymns with no library at the bottom.
 */
export function librarySortKey(library: string | null): number {
  if (!library) {
    return Number.MAX_SAFE_INTEGER;
  }

  const idx = LIBRARY_SORT_ORDER.indexOf(library.trim().toLowerCase());
  if (idx >= 0) {
    return idx;
  }

  // Unknown named libraries sit after known ones, before null.
  return LIBRARY_SORT_ORDER.length;
}

/** Compare hymns by library (Rejoice → TBC → other → none), then page, then title. */
export function compareHymnsByLibraryAndPage(
  a: HymnSortFields,
  b: HymnSortFields,
): number {
  const libraryRankA = librarySortKey(a.library);
  const libraryRankB = librarySortKey(b.library);
  if (libraryRankA !== libraryRankB) {
    return libraryRankA - libraryRankB;
  }

  if (
    libraryRankA === LIBRARY_SORT_ORDER.length &&
    a.library &&
    b.library
  ) {
    const nameCmp = a.library.localeCompare(b.library, undefined, {
      sensitivity: "base",
    });
    if (nameCmp !== 0) {
      return nameCmp;
    }
  }

  const pageA = a.page ?? Number.MAX_SAFE_INTEGER;
  const pageB = b.page ?? Number.MAX_SAFE_INTEGER;
  if (pageA !== pageB) {
    return pageA - pageB;
  }

  return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
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
  let imageFile: string | null = null;
  let tags: string[] = [];
  let library: string | null = null;
  let page: number | null = null;
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
      if (line.startsWith("image_file:")) {
        imageFile = stripMetadataComment(line.replace("image_file:", "")) || null;
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
      if (line.startsWith("page:")) {
        const raw = stripMetadataComment(line.replace("page:", ""));
        const parsed = Number.parseInt(raw, 10);
        page = Number.isFinite(parsed) ? parsed : null;
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
    imageFile,
    tags,
    library,
    page,
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
