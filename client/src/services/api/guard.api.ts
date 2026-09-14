import { apiClient } from './axiosClient';
import { GuardProfile } from '../../types';

export const guardApi = {
  // Guard self profile
  getProfile: async (): Promise<GuardProfile> => {
    const res = await apiClient.get<{ success: boolean; data: GuardProfile }>('/guards/profile');
    return res.data.data;
  },

  updateProfile: async (data: {
    name?: string;
    phone?: string;
    email?: string;
    profilePhoto?: string | null;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<GuardProfile> => {
    const res = await apiClient.put<{ success: boolean; message: string; data: GuardProfile }>('/guards/profile', data);
    return res.data.data;
  },

  // Admin Guard Management
  getAllGuards: async (): Promise<GuardProfile[]> => {
    const res = await apiClient.get<{ success: boolean; data: GuardProfile[] }>('/guards');
    return res.data.data;
  },

  createGuard: async (data: {
    name: string;
    badgeNumber: string;
    phone: string;
    email: string;
    password: string;
    gateNumber: string;
    shift: string;
    profilePhoto?: string | null;
    isActive?: boolean;
  }): Promise<any> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>('/guards', data);
    return res.data.data;
  },

  updateGuard: async (id: string, data: Partial<{
    name: string;
    badgeNumber: string;
    phone: string;
    email: string;
    password: string;
    gateNumber: string;
    shift: string;
    profilePhoto?: string | null;
    isActive: boolean;
  }>): Promise<any> => {
    const res = await apiClient.put<{ success: boolean; message: string; data: any }>(`/guards/${id}`, data);
    return res.data.data;
  },

  deleteGuard: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/guards/${id}`);
    return res.data;
  },

  toggleStatus: async (id: string, isActive: boolean): Promise<{ message: string }> => {
    const res = await apiClient.patch<{ success: boolean; message: string }>(`/guards/${id}/status`, { isActive });
    return res.data;
  },
};
