export const HYMN_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

export interface ParsedHymnFile {
  title: string;
  author: string;
  /** @deprecated Images are resolved from the hymn folder; kept so old files still parse. */
  imageFolder: string | null;
  /** @deprecated Images are resolved from the hymn folder; kept so old files still parse. */
  imageFile: string | null;
  tags: string[];
  library: string | null;
  page: number | null;
  link: string | null;
  lyrics: string;
}

/** True when `filename` is a sheet-music image the seed/API should pick up. */
export function isHymnImageFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return HYMN_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Reads a trailing page number from a hymn folder name such as
 * `His Mercy Is More - TBC 16`.
 */
export function inferPageFromFolderName(folderName: string): number | null {
  const match = folderName.trim().match(/(\d+)\s*$/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Preferred library order for catalog sorting; unknown libraries follow these. */
const LIBRARY_SORT_ORDER = ["rejoice", "tbc"];

const LIBRARY_DISPLAY_NAMES: Record<string, string> = {
  rejoice: "Rejoice",
  tbc: "TBC",
};

export interface LibraryHymnGroup<T> {
  library: string | null;
  label: string;
  data: T[];
}

/** Display name for a library folder (`tbc` → `TBC`, unknown names kept as stored). */
export function formatLibraryLabel(library: string | null): string {
  if (!library || !library.trim()) {
    return "Other hymns";
  }

  const trimmed = library.trim();
  return LIBRARY_DISPLAY_NAMES[trimmed.toLowerCase()] ?? trimmed;
}

/** Groups hymns by library, ordered Rejoice → TBC → other named libraries → none. */
export function groupHymnsByLibrary<T extends { library: string | null }>(
  hymns: T[],
): LibraryHymnGroup<T>[] {
  const buckets = new Map<string, T[]>();

  for (const hymn of hymns) {
    const key = hymn.library?.trim().toLowerCase() ?? "";
    const existing = buckets.get(key);
    if (existing) {
      existing.push(hymn);
    } else {
      buckets.set(key, [hymn]);
    }
  }

  return [...buckets.entries()]
    .map(([key, data]) => {
      const library = key === "" ? null : (data[0]?.library ?? key);
      return {
        library,
        label: formatLibraryLabel(library),
        data,
      };
    })
    .sort((a, b) => {
      const rankA = librarySortKey(a.library);
      const rankB = librarySortKey(b.library);
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
    });
}

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
