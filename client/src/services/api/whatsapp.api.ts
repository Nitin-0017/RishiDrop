import { apiClient } from './axiosClient';

export const whatsappApi = {
  simulateMessage: async (fromPhone: string, message: string) => {
    const res = await apiClient.post<{
      success: boolean;
      data: {
        messageId?: string;
        reply: string;
        qrData?: string;
        qrPayload?: string;
        otp?: string;
        parcelId?: string;
        role?: 'STUDENT' | 'GUARD' | 'ADMIN' | 'UNREGISTERED';
        user?: {
          id: string;
          name: string;
          identifier: string;
          phone: string;
          role: string;
        };
        student?: any;
      };
    }>('/whatsapp/simulate', {
      from: fromPhone,
      message,
    });
    return res.data;
  },

  resolveAccount: async (phone: string) => {
    const params = `?phone=${encodeURIComponent(phone)}`;
    const res = await apiClient.get<{
      success: boolean;
      data: {
        role: 'STUDENT' | 'GUARD' | 'ADMIN' | 'UNREGISTERED';
        displayName: string;
        identifier: string;
        phone: string;
        digits10: string;
        errorType?: string;
      };
    }>(`/whatsapp/account${params}`);
    return res.data;
  },

  getMessageLog: async (phone?: string) => {
    const params = phone ? `?phone=${encodeURIComponent(phone)}` : '';
    const res = await apiClient.get<{ success: boolean; data: any[] }>(`/whatsapp/messages${params}`);
    return res.data;
  }
};
