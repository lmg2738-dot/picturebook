import { z } from "zod";

export const bookInputSchema = z.object({
  name: z.string().min(1).max(20),
  age: z.number().int().min(1).max(12),
  favorite: z.string().min(1).max(50),
  lesson: z.string().min(1).max(50),
});

export { createBook } from "@/lib/storage/books";
