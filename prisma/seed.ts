import { PrismaClient } from "@prisma/client";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import {
  buildTagsSearchText,
  inferPageFromFolderName,
  isHymnImageFile,
  parseHymnFile,
} from "@hymn-app/shared-utils";

const prisma = new PrismaClient();
const hymnsDir = join(process.cwd(), "data", "hymns");
const SKIP_DIR_NAMES = new Set(["images", "sheets"]);

function toPosixPath(filePath: string): string {
  return filePath.split("\\").join("/");
}

function toRelativeHymnPath(absolutePath: string): string {
  return toPosixPath(relative(hymnsDir, absolutePath));
}

function collectHymnTextFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  const results: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name.toLowerCase())) {
        continue;
      }
      results.push(...collectHymnTextFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".txt")) {
      results.push(fullPath);
    }
  }

  return results.sort((a, b) =>
    toRelativeHymnPath(a).localeCompare(toRelativeHymnPath(b), undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

/** 0 = hymns root, 1 = library folder, 2+ = per-hymn folder. */
function depthFromHymnsRoot(dir: string): number {
  const relativeDir = toRelativeHymnPath(dir);
  if (!relativeDir || relativeDir === ".") {
    return 0;
  }
  return relativeDir.split("/").filter(Boolean).length;
}

function libraryFromPath(txtAbsolutePath: string): string | null {
  const relativePath = toRelativeHymnPath(txtAbsolutePath);
  const [libraryFolder] = relativePath.split("/");
  if (!libraryFolder || relativePath === libraryFolder) {
    return null;
  }
  return libraryFolder;
}

function listImagesInDir(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir)
    .filter(isHymnImageFile)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((filename) => join(dir, filename));
}

/**
 * Lyrics-only files live directly in a library folder; match images by stem.
 * Per-hymn folders take every image beside the .txt, plus optional `sheets/`.
 */
function findCoLocatedImages(txtAbsolutePath: string): string[] {
  const dir = dirname(txtAbsolutePath);
  const stem = basename(txtAbsolutePath, extname(txtAbsolutePath));
  const inSameFolder = listImagesInDir(dir);

  if (depthFromHymnsRoot(dir) <= 1) {
    return inSameFolder
      .filter((filePath) => basename(filePath, extname(filePath)) === stem)
      .map(toRelativeHymnPath);
  }

  const inSheets = listImagesInDir(join(dir, "sheets"));
  return [...inSameFolder, ...inSheets]
    .sort((a, b) =>
      basename(a).localeCompare(basename(b), undefined, { numeric: true }),
    )
    .map(toRelativeHymnPath);
}

async function main() {
  const files = collectHymnTextFiles(hymnsDir);

  if (files.length === 0) {
    console.warn(`No hymn .txt files found under ${hymnsDir}`);
    return;
  }

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const parsed = parseHymnFile(content);
    const imagePaths = findCoLocatedImages(file);
    const library = parsed.library ?? libraryFromPath(file);
    const hymnDir = dirname(file);
    const page =
      parsed.page ??
      (depthFromHymnsRoot(hymnDir) >= 2
        ? inferPageFromFolderName(basename(hymnDir))
        : null);
    const tagsSearch = buildTagsSearchText(parsed.tags);
    const relativeFile = toRelativeHymnPath(file);

    await prisma.hymn.upsert({
      where: { title: parsed.title },
      update: {
        author: parsed.author,
        lyrics: parsed.lyrics,
        imagePaths,
        tags: parsed.tags,
        tagsSearch,
        library,
        page,
        link: parsed.link,
      },
      create: {
        title: parsed.title,
        author: parsed.author,
        lyrics: parsed.lyrics,
        imagePaths,
        tags: parsed.tags,
        tagsSearch,
        library,
        page,
        link: parsed.link,
      },
    });

    const imageNote =
      imagePaths.length > 0
        ? ` (${imagePaths.length} page${imagePaths.length === 1 ? "" : "s"})`
        : " (no images)";
    console.log(`Seeded: ${parsed.title}${imageNote}`);
    console.log(`  source: ${relativeFile}`);
    for (const path of imagePaths) {
      console.log(`  - ${path}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
