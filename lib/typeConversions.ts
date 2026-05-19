// Type conversion utilities between Prisma enums and client-safe enums
import { Categories as PrismaCategories, difficulties as PrismaDifficulties, tilteType as PrismaTitleType } from "@/lib/generated/prisma/client";
import { Categories, difficulties, tilteType } from "@/lib/enums";

export function convertCategory(prismaCategory: PrismaCategories | null): Categories | null {
  if (!prismaCategory) return null;
  return prismaCategory as Categories;
}

export function convertDifficulty(prismaDifficulty: PrismaDifficulties | null): difficulties | null {
  if (!prismaDifficulty) return null;
  return prismaDifficulty as difficulties;
}

export function convertTitle(prismaTitle: PrismaTitleType | null): tilteType | null {
  if (!prismaTitle) return null;
  return prismaTitle as tilteType;
}
