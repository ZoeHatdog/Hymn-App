export interface ParsedHymnFile {
  title: string;
  author: string;
  lyrics: string;
}

export function parseHymnFile(content: string): ParsedHymnFile {
  const lines = content.split(/\r?\n/);
  let title = "Untitled";
  let author = "Unknown";
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
    lyrics: lyricsLines.join("\n").trim(),
  };
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function sanitizeSearchQuery(query: string): string {
  return query.trim().slice(0, 100);
}
