import { apiClient } from './axiosClient';
import { StorageOverview, SlotStatus } from '../../types';

export const storageApi = {
  getOverview: async () => {
    const res = await apiClient.get<{ success: boolean; data: StorageOverview }>('/storage');
    return res.data;
  },

  updateSlotStatus: async (slotId: string, status: SlotStatus) => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: any }>(
      `/storage/slots/${slotId}/status`,
      { status }
    );
    return res.data;
  },

  // Rack Management
  createRack: async (data: { name: string; code: string; zone?: string; initialSlots?: number; slotCapacity?: number }) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>('/storage/racks', data);
    return res.data;
  },

  updateRack: async (rackId: string, data: { name?: string; zone?: string; isActive?: boolean }) => {
    const res = await apiClient.put<{ success: boolean; message: string; data: any }>(`/storage/racks/${rackId}`, data);
    return res.data;
  },

  deleteRack: async (rackId: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/storage/racks/${rackId}`);
    return res.data;
  },

  // Slot Management
  createSlot: async (data: { rackId: string; slotNumber: string; capacity?: number }) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>('/storage/slots', data);
    return res.data;
  },

  updateSlot: async (slotId: string, data: { capacity?: number; status?: SlotStatus }) => {
    const res = await apiClient.put<{ success: boolean; message: string; data: any }>(`/storage/slots/${slotId}`, data);
    return res.data;
  },

  deleteSlot: async (slotId: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/storage/slots/${slotId}`);
    return res.data;
  },
};
