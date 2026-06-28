import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { buildTagsSearchText, parseHymnFile } from "@hymn-app/shared-utils";

const prisma = new PrismaClient();
const hymnsDir = join(process.cwd(), "data", "hymns");
const imagesDir = join(hymnsDir, "images");
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];

function isImageFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function toRelativeImagePath(absolutePath: string): string {
  return relative(imagesDir, absolutePath).split("\\").join("/");
}

function findImagePathsFromFolder(folder: string): string[] {
  const folderPath = join(imagesDir, folder);
  if (!existsSync(folderPath)) {
    console.warn(`  Warning: image folder not found: ${folder}`);
    return [];
  }

  return readdirSync(folderPath)
    .filter(isImageFile)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((filename) => toRelativeImagePath(join(folderPath, filename)));
}

function findFlatImagePath(stem: string): string[] {
  for (const ext of IMAGE_EXTENSIONS) {
    const filename = `${stem}${ext}`;
    const absolutePath = join(imagesDir, filename);
    if (existsSync(absolutePath)) {
      return [toRelativeImagePath(absolutePath)];
    }
  }
  return [];
}

function resolveImagePaths(stem: string, imageFolder: string | null): string[] {
  if (imageFolder) {
    return findImagePathsFromFolder(imageFolder);
  }
  return findFlatImagePath(stem);
}

async function main() {
  const files = readdirSync(hymnsDir).filter((file) => file.endsWith(".txt"));

  for (const file of files) {
    const content = readFileSync(join(hymnsDir, file), "utf-8");
    const { title, author, lyrics, imageFolder, tags, library, link } =
      parseHymnFile(content);
    const stem = basename(file, extname(file));
    const imagePaths = resolveImagePaths(stem, imageFolder);
    const tagsSearch = buildTagsSearchText(tags);

    await prisma.hymn.upsert({
      where: { title },
      update: { author, lyrics, imagePaths, tags, tagsSearch, library, link },
      create: {
        title,
        author,
        lyrics,
        imagePaths,
        tags,
        tagsSearch,
        library,
        link,
      },
    });

    const imageNote =
      imagePaths.length > 0
        ? ` (${imagePaths.length} page${imagePaths.length === 1 ? "" : "s"})`
        : " (no images)";
    console.log(`Seeded: ${title}${imageNote}`);
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
