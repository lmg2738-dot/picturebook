export type BookStatus =
  | "pending"
  | "generating_story"
  | "generating_images"
  | "generating_audio"
  | "completed"
  | "failed";

export interface BookInput {
  name: string;
  age: number;
  favorite: string;
  lesson: string;
}

export interface StoryPage {
  page_no: number;
  story: string;
  image_prompt: string;
}

export interface GeneratedStory {
  title: string;
  pages: StoryPage[];
}

export interface Book {
  id: string;
  title: string | null;
  child_name: string;
  child_age: number;
  favorite: string;
  lesson: string;
  status: BookStatus;
  progress: number;
  error_message: string | null;
  pdf_url: string | null;
  /** 현재 작업 설명 (예: "3페이지 삽화를 그리는 중...") */
  status_message: string | null;
  images_done: number;
  images_total: number;
  /** 최근 생성 로그 (최신순) */
  generation_log: string[];
  created_at: string;
  updated_at: string;
}

export interface BookPage {
  id: string;
  book_id: string;
  page_no: number;
  story: string;
  image_prompt: string | null;
  image_url: string | null;
  audio_url: string | null;
  created_at: string;
}

export interface BookWithPages extends Book {
  pages: BookPage[];
}
