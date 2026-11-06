import api, { type ApiResponse } from './api';
import type { DashboardStats } from '@/types/issue';
export const dashboardService = {
  stats: async () =>
    (await api.get<ApiResponse<DashboardStats>>('/dashboard/stats')).data.data,
};
