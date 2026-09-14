import { apiClient } from './axiosClient';
import { OverviewMetrics, DetailedAnalytics, ForecastData } from '../../types';

export const analyticsApi = {
  getOverview: async () => {
    const res = await apiClient.get<{ success: boolean; data: OverviewMetrics }>('/analytics/overview');
    return res.data;
  },

  getDetailed: async () => {
    const res = await apiClient.get<{ success: boolean; data: DetailedAnalytics }>('/analytics/detailed');
    return res.data;
  },

  getForecast: async () => {
    const res = await apiClient.get<{ success: boolean; data: ForecastData }>('/analytics/forecast');
    return res.data;
  },

  getGuards: async () => {
    const res = await apiClient.get<{ success: boolean; data: any[] }>('/admin/guards');
    return res.data;
  },

  getAuditLogs: async (page = 1, limit = 30) => {
    const res = await apiClient.get<{
      success: boolean;
      data: any[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/admin/audit-logs?page=${page}&limit=${limit}`);
    return res.data;
  },

  triggerUnclaimedJob: async () => {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>('/admin/jobs/trigger-unclaimed');
    return res.data;
  },

  getSettings: async () => {
    const res = await apiClient.get<{ success: boolean; data: any[] }>('/admin/settings');
    return res.data;
  }
};
