import { apiClient } from './axiosClient';
import { DeliveryItem, DeliveryPartner, ParcelDetails, CreateDeliveryParams } from '../../types';

export const deliveryApi = {
  create: async (params: CreateDeliveryParams) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>('/deliveries', params);
    return res.data;
  },

  getParcelDetails: async (id: string): Promise<ParcelDetails> => {
    const res = await apiClient.get<{ success: boolean; data: ParcelDetails }>(`/deliveries/parcels/${id}`);
    return res.data.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    partnerId?: string;
    guardId?: string;
    studentId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          searchParams.append(key, String(val));
        }
      });
    }

    const res = await apiClient.get<{
      success: boolean;
      data: DeliveryItem[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/deliveries?${searchParams.toString()}`);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: any }>(`/deliveries/${id}`);
    return res.data;
  },

  getPartners: async () => {
    const res = await apiClient.get<{ success: boolean; data: DeliveryPartner[] }>('/deliveries/partners');
    return res.data;
  },

  getNextOversizedRef: async () => {
    const res = await apiClient.get<{ success: boolean; data: { reference: string; datePrefix: string } }>(
      '/deliveries/next-oversized-ref'
    );
    return res.data;
  },
};
