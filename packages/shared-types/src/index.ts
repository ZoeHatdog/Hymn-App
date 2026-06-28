export interface Hymn {
  id: string;
  title: string;
  author: string;
  lyrics: string;
  imageUrls: string[];
  tags: string[];
  library: string | null;
  link: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HymnSummary {
  id: string;
  title: string;
  author: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}
