import { PrismaClient } from "@academyos/database";
import { promises as fs } from "node:fs";
import path from "node:path";

const root = path.resolve(
  process.cwd(),
  "..",
  "..",
  "content",
  "sources",
  "detran-marketplace-docs",
  "docs",
);

const modules = [
  { slug: "architecture", title: "Arquitetura", order: 10, dir: "architecture" },
  { slug: "adr", title: "Decisões de Arquitetura", order: 20, dir: "architecture/adr" },
  { slug: "implementation", title: "Implementação", order: 30, dir: "implementation" },
  { slug: "governance", title: "Governança", order: 40, dir: "governance" },
  { slug: "reference", title: "Referência", order: 50, dir: "reference" },
];

const prisma = new PrismaClient();

async function main() {
  const trackData = {
    slug: "detran-marketplace",
    title: "Vehicle Marketplace (Detran SP)",
    description:
      "Trilha prática de ServiceNow com modelagem de domínio, governança, arquitetura, update sets e documentação técnica.",
  };

  const track = await prisma.track.upsert({
    where: { slug: trackData.slug },
    update: trackData,
    create: trackData,
  });

  await prisma.module.deleteMany({
    where: { trackId: track.id }
  });

  for (const module of modules) {
    const moduleRow = await prisma.module.create({
      data: {
        trackId: track.id,
        title: module.title,
        order: module.order,
      },
    });

    const lessons = await readLessons(module.dir);

    for (const lesson of lessons) {
      await prisma.lesson.upsert({
        where: { slug: lesson.slug },
        update: {
          title: lesson.title,
          content: {
            type: "markdown",
            sourcePath: lesson.sourcePath,
            body: lesson.content,
          },
          sourceType: "IMPORTED_MD",
          order: lesson.order,
          moduleId: moduleRow.id,
        },
        create: {
          title: lesson.title,
          slug: lesson.slug,
          content: {
            type: "markdown",
            sourcePath: lesson.sourcePath,
            body: lesson.content,
          },
          sourceType: "IMPORTED_MD",
          order: lesson.order,
          moduleId: moduleRow.id,
        },
      });
    }
  }

  console.log("Imported Detran Marketplace track into Prisma.");
}

async function readLessons(relativeDir: string) {
  const dir = path.join(root, relativeDir);
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const lessons: any[] = [];

  for (const [index, entry] of entries.entries()) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    const sourcePath = path.join("docs", relativeDir, entry.name).replaceAll("\\", "/");
    const absolutePath = path.join(dir, entry.name);
    const content = await fs.readFile(absolutePath, "utf8");
    const slug = entry.name.replace(/\.md$/, "");

    lessons.push({
      slug,
      title: extractTitle(content, slug),
      order: extractOrder(entry.name, index),
      content,
      sourcePath,
    });
  }

  return lessons.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function extractTitle(markdown: string, fallback: string) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();

  if (heading) {
    return heading.replace(/\s+—\s+/g, " - ");
  }

  return fallback
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractOrder(filename: string, index: number) {
  const explicit = filename.match(/(?:ADR-|US-)(\d+)/)?.[1];

  return explicit ? Number(explicit) : 1000 + index;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
