export interface Post {
  id: number;
  username: string;
  created_datetime: string;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  is_liked_by_me: boolean;
}

export interface CommentType {
  id: number;
  username: string;
  content: string;
  created_datetime: string;
}

export interface PostCreate {
  username: string;
  title: string;
  content: string;
}

export interface PostUpdate {
  title: string;
  content: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
