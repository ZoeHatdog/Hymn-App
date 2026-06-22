export interface ParsedHymnFile {
  title: string;
  author: string;
  imageFolder: string | null;
  lyrics: string;
}

export function parseHymnFile(content: string): ParsedHymnFile {
  const lines = content.split(/\r?\n/);
  let title = "Untitled";
  let author = "Unknown";
  let imageFolder: string | null = null;
  const lyricsLines: string[] = [];
  let inLyrics = false;

  for (const line of lines) {
    if (!inLyrics) {
      if (line.startsWith("title:")) {
        title = line.replace("title:", "").trim();
        continue;
      }
      if (line.startsWith("author:")) {
        author = line.replace("author:", "").trim();
        continue;
      }
      if (line.startsWith("image_folder:")) {
        imageFolder = line.replace("image_folder:", "").trim() || null;
        continue;
      }
      if (line.trim() === "") {
        inLyrics = true;
        continue;
      }
    } else {
      lyricsLines.push(line);
    }
  }

  return {
    title,
    author,
    imageFolder,
    lyrics: lyricsLines.join("\n").trim(),
  };
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function sanitizeSearchQuery(query: string): string {
  return query.trim().slice(0, 100);
}
