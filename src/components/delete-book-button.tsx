"use client";

import { useRouter } from "next/navigation";
import { deleteBook } from "@/lib/actions/books";
import { Button } from "@/components/ui/button";

interface DeleteBookButtonProps {
  bookId: string;
}

export function DeleteBookButton({ bookId }: DeleteBookButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("이 그림책을 삭제하시겠습니까?")) return;
    await deleteBook(bookId);
    router.push("/library");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} className="text-ink-light hover:text-red-600">
      삭제
    </Button>
  );
}
