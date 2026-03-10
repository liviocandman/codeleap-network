import axios from "axios";
import { auth } from "../firebase";
import type { Post, PostCreate, PostUpdate, PaginatedResponse, CommentType } from "../types/post";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

api.interceptors.request.use(async (config) => {

  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      // Ignored if dummy api key 
    }
  }

  // Fallback / primary identifier
  const localUsername = localStorage.getItem("codeleap_username");
  if (localUsername) {
    config.headers["X-Username"] = localUsername;
  }

  return config;
});

export const getPosts = async (limit = 20, offset = 0) => {
  const { data } = await api.get<PaginatedResponse<Post>>("/careers/", {
    params: { limit, offset },
  });
  return data;
};

export const createPost = async (post: PostCreate) => {
  const { data } = await api.post<Post>("/careers/", post);
  return data;
};

export const updatePost = async (id: number, post: PostUpdate) => {
  const { data } = await api.patch<Post>(`/careers/${id}/`, post);
  return data;
};

export const deletePost = async (id: number) => {
  await api.delete(`/careers/${id}/`);
};

export const likePost = async (id: number) => {
  await api.post(`/careers/${id}/like/`);
};

export const unlikePost = async (id: number) => {
  await api.delete(`/careers/${id}/like/`);
};

export const getComments = async (id: number) => {
  const { data } = await api.get<CommentType[] | PaginatedResponse<CommentType>>(`/careers/${id}/comments/`);
  return data;
};

export const addComment = async (id: number, content: string) => {
  const { data } = await api.post<CommentType>(`/careers/${id}/comments/`, { content });
  return data;
};
