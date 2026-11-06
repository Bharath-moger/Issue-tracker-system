import api, { type ApiResponse } from './api';
import type { Credentials, Registration, Session, User } from '@/types/user';
export const authService = {
  login: async (input: Credentials) =>
    (await api.post<ApiResponse<Session>>('/auth/login', input)).data.data,
  register: async (input: Registration) =>
    (await api.post<ApiResponse<Session>>('/auth/register', input)).data.data,
  me: async () => (await api.get<ApiResponse<User>>('/auth/me')).data.data,
};
