import { apiClient } from './axiosClient';
import { Student } from '../../types';

export const studentApi = {
  search: async (query: string, limit = 10) => {
    const res = await apiClient.get<{ success: boolean; count: number; data: Student[] }>(
      `/students/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return res.data;
  },

  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.search) searchParams.append('search', params.search);

    const res = await apiClient.get<{
      success: boolean;
      data: Student[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/students?${searchParams.toString()}`);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: any }>(`/students/${id}`);
    return res.data;
  },
};
