export interface HymnSummary {
  id: string;
  title: string;
  author: string;
  library: string | null;
  page: number | null;
}

export interface HymnDraft {
  title: string;
  author: string;
  lyrics: string;
  library: string | null;
  page: number | null;
  tags: string[];
  link: string | null;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: string;
}
