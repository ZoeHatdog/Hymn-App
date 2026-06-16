import { PrismaClient } from "@prisma/client";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseHymnFile } from "@hymn-app/shared-utils";

const prisma = new PrismaClient();
const hymnsDir = join(process.cwd(), "data", "hymns");

async function main() {
  const files = readdirSync(hymnsDir).filter((file) => file.endsWith(".txt"));

  for (const file of files) {
    const content = readFileSync(join(hymnsDir, file), "utf-8");
    const { title, author, lyrics } = parseHymnFile(content);

    await prisma.hymn.upsert({
      where: { title },
      update: { author, lyrics },
      create: { title, author, lyrics },
    });

    console.log(`Seeded: ${title}`);
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
