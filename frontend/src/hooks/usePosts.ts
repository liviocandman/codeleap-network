import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/posts";
import type { PostCreate, PostUpdate } from "../types/post";

export function useInfinitePosts(limit = 20) {
  return useInfiniteQuery({
    queryKey: ["posts", limit],
    queryFn: ({ pageParam = 0 }) => api.getPosts(limit, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.next) {
        return allPages.length * limit;
      }
      return undefined;
    },
    initialPageParam: 0,
    refetchInterval: 15000,
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.likePost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function useUnlikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.unlikePost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => api.addComment(id, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: PostCreate) => api.createPost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PostUpdate }) =>
      api.updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
