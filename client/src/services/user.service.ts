import api, { type ApiResponse } from './api';
import type { User } from '@/types/user';
export const userService = {
  list: async () => (await api.get<ApiResponse<User[]>>('/users')).data.data,
  get: async (id: string) =>
    (await api.get<ApiResponse<User>>(`/users/${id}`)).data.data,
  update: async (id: string, input: Pick<User, 'name' | 'email'>) =>
    (await api.patch<ApiResponse<User>>(`/users/${id}`, input)).data.data,
  remove: async (id: string) => {
    await api.delete(`/users/${id}`);
  },
};
