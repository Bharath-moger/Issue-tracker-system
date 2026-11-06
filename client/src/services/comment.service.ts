import api, { type ApiResponse } from './api';
import type { Comment } from '@/types/comment';
export const commentService = {
  list: async (id: string) =>
    (await api.get<ApiResponse<Comment[]>>(`/issues/${id}/comments`)).data.data,
  create: async (id: string, content: string) =>
    (
      await api.post<ApiResponse<Comment>>(`/issues/${id}/comments`, {
        content,
      })
    ).data.data,
};
