import { apiClient } from './axiosClient';
import { User } from '../../types';

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post<{ success: boolean; token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
    return res.data;
  },

  getDemoAccounts: async () => {
    const res = await apiClient.get<{
      success: boolean;
      accounts: Array<{
        role: string;
        label: string;
        email: string;
        password: string;
        description: string;
      }>;
    }>('/auth/demo-accounts');
    return res.data;
  },
};
